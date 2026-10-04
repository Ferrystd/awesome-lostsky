<?php
declare(strict_types=1);

namespace app\job;

use app\enum\WeiboAccountHealth;
use app\enum\WeiboExecutionStatus;
use app\enum\WeiboOperationSource;
use app\enum\WeiboOperationType;
use app\enum\WeiboReason;
use app\enum\WeiboTaskStatus;
use app\model\WeiboAccount;
use app\model\WeiboAccountBinding;
use app\model\WeiboOperationLog;
use app\model\WeiboTask;
use app\model\WeiboTaskAccount;
use app\model\WeiboTaskMedia;
use app\service\AbilityResolver;
use app\service\Notice;
use app\service\WeiboOperations;
use app\service\WeiboProtocol;
use app\service\WeiboTasks;
use think\queue\Job;
use think\facade\Db;
use think\exception\HttpException;

final class RunWeiboTask
{
    public function fire(Job $job, array $data): void
    {
        $taskId = $data['task_id'] ?? null;
        $version = $data['version'] ?? null;
        $plannedAt = $data['planned_at'] ?? null;
        if (!is_int($taskId) || !is_int($version) || !is_int($plannedAt)) { $job->delete(); return; }
        try {
            $this->lockTask($job, $taskId, $version, $plannedAt);
        } catch (\Throwable $exception) {
            try {
                \think\facade\Log::error('微博任务执行锁异常，已退避重试', ['task_id' => $taskId, 'error' => $exception->getMessage()]);
            } catch (\Throwable) {}
            if (!$job->isDeleted() && !$job->isReleased()) $job->release(60);
        }
    }

    private function lockTask(Job $job, int $taskId, int $version, int $plannedAt): void
    {
        $connection = Db::connect();
        // 锁必须与业务写入共享单主库会话，且不得通过重连悄悄失去锁。
        if ($connection->getConfig('type') !== 'mysql' || $connection->getConfig('deploy') || $connection->getConfig('break_reconnect') || ($connection->getConfig('params')[\PDO::ATTR_PERSISTENT] ?? false)) {
            throw new \RuntimeException('微博任务执行锁要求非持久、禁止断线重连的单主库 MySQL 连接');
        }
        $pdo = $connection->connect();
        $lockName = 'weibo_task:' . substr(hash('sha256', $connection->getConfig('database')), 0, 16) . ':' . $taskId;
        $acquire = $pdo->prepare('SELECT GET_LOCK(?, 0)');
        $acquire->execute([$lockName]);
        $acquired = $acquire->fetchColumn();
        if (!in_array($acquired, [1, '1'], true)) {
            if ($acquired === null || $acquired === false) throw new \RuntimeException('微博任务执行锁获取失败');
            $job->release(30);
            return;
        }
        try {
            // 获取锁后重新读取任务；锁按 task ID 跨版本/周期保护整个执行过程。
            $this->runLocked($job, $taskId, $version, $plannedAt);
        } finally {
            try {
                $release = $pdo->prepare('SELECT RELEASE_LOCK(?)');
                $release->execute([$lockName]);
            } catch (\Throwable $exception) {
                // 连接断开会由数据库释放会话锁；释放错误不能覆盖原执行异常。
                try { \think\facade\Log::error('微博任务执行锁释放异常', ['task_id' => $taskId, 'error' => $exception->getMessage()]); } catch (\Throwable) {}
            }
        }
    }

    private function runLocked(Job $job, int $taskId, int $version, int $plannedAt): void
    {
        $task = WeiboTask::find($taskId);
        if (!$task || $task->enumCase('status') !== WeiboTaskStatus::Active || $task->version !== $version || $task->next_run_at !== $plannedAt) { $job->delete(); return; }
        if (!app(AbilityResolver::class)->available($task->team_id, 'weibo')) {
            if (!$this->current($task)->update(['status' => WeiboTaskStatus::BlockedAbility->value, 'block_reason' => 'ability_missing', 'next_run_at' => null, 'version' => $version + 1])) { $job->delete(); return; }
            app(Notice::class)->sendOnce($task->team_id, '微博任务已阻塞', '团队缺少微博 Ability，续期后请手动恢复任务。', "weibo:task:{$task->id}:blocked-ability:v{$version}");
            $job->delete(); return;
        }
        try {
            $this->attempt($job, $task, $version, $plannedAt);
        } catch (\Throwable $exception) {
            $this->retryAbnormal($job, $task, $version, $exception);
        }
    }

    private function attempt(Job $job, WeiboTask $task, int $version, int $plannedAt): void
    {
        $dispatchKey = "task:{$task->id}:v{$version}:at{$plannedAt}";
        $existing = WeiboOperationLog::where('dispatch_key', $dispatchKey)->find();
        if ($existing) {
            if ($existing->enumCase('status') === WeiboExecutionStatus::Dispatching) {
                $existing->save(['status' => WeiboExecutionStatus::Unknown->value, 'reason' => WeiboReason::Unknown->value, 'remote_message' => '执行进程在远程请求后未回写结果', 'finished_at' => time()]);
                $this->notifyUnknown($task, $existing->id);
            }
            $this->scheduleNext($task);
            $job->delete(); return;
        }
        $operationType = $task->enumCase('operation_type');
        if ($operationType === WeiboOperationType::Checkin) {
            $todayStart = (new \DateTimeImmutable('today'))->getTimestamp();
            $attemptedToday = WeiboOperationLog::where('task_id', $task->id)
                ->where('operation_type', WeiboOperationType::Checkin->value)
                ->where('source', WeiboOperationSource::Schedule->value)
                ->where('started_at', '>=', $todayStart)
                ->find();
            if ($attemptedToday) {
                $this->scheduleNext($task);
                $job->delete(); return;
            }
        }
        // 只考虑仍绑定的候选账号，口径与 WeiboOperations::bound() 一致：
        // 个人任务要求绑定到 owner，团队任务只要求团队内存在绑定。
        $candidateIds = array_map(static fn(WeiboTaskAccount $relation): int => $relation->account_id, WeiboTaskAccount::where('task_id', $task->id)->select()->all());
        $bindingQuery = WeiboAccountBinding::where('team_id', $task->team_id);
        if ($task->owner_entity_id !== null) $bindingQuery->where('entity_id', $task->owner_entity_id);
        $boundIds = array_map(static fn(WeiboAccountBinding $binding): int => $binding->account_id, $bindingQuery->select()->all());
        $ids = $this->randomize(array_values(array_intersect($candidateIds, $boundIds)));
        $selected = null; $hasUnknown = false;
        foreach ($ids as $id) {
            $account = WeiboAccount::find($id); if (!$account) continue;
            $check = app(WeiboProtocol::class)->check($account);
            $health = $check['valid'] === true ? WeiboAccountHealth::Valid : ($check['valid'] === false ? WeiboAccountHealth::Invalid : WeiboAccountHealth::Unknown);
            $account->save(['health' => $health->value, 'checked_at' => time()]);
            if ($check['valid'] === true) { $selected = $id; break; }
            if ($check['valid'] === null) $hasUnknown = true;
        }
        if (!$this->current($task)->find()) { $job->delete(); return; }
        if ($selected === null) {
            if ($hasUnknown) {
                $log = new WeiboOperationLog;
                $log->save([
                    'dispatch_key' => $dispatchKey, 'team_id' => $task->team_id,
                    'owner_entity_id' => $task->owner_entity_id ?: null,
                    'actor_entity_id' => null, 'account_id' => null, 'task_id' => $task->id,
                    'task_version' => $version, 'operation_type' => $operationType->value,
                    'source' => WeiboOperationSource::Schedule->value, 'status' => WeiboExecutionStatus::Unknown->value,
                    'content_summary' => mb_substr($operationType === WeiboOperationType::Checkin ? $task->display_tag : $task->content, 0, 120),
                    'reason' => WeiboReason::Unknown->value, 'remote_message' => '候选账号登录态均未能确认，本周期未调用远端写接口',
                    'started_at' => time(), 'finished_at' => time(),
                ]);
                app(Notice::class)->sendOnce($task->team_id, '微博任务本周期未执行', '候选账号登录态暂时无法确认，未调用微博写接口，任务将继续下一周期。', "weibo:operation:{$log->id}:unknown-login");
                $this->scheduleNext($task);
                $job->delete(); return;
            }
            if (!$this->current($task)->update(['status' => WeiboTaskStatus::BlockedLogin->value, 'block_reason' => 'all_accounts_invalid', 'next_run_at' => null, 'version' => $version + 1])) { $job->delete(); return; }
            app(Notice::class)->sendOnce($task->team_id, '微博任务已阻塞', '所有候选账号均无法确认为有效，重新登录后请手动恢复任务。', "weibo:task:{$task->id}:blocked-login:v{$version}");
            $job->delete(); return;
        }
        $payload = ['topic' => ['name' => $task->topic_name, 'container_id' => $task->container_id, 'topic_id' => $task->topic_id, 'display_tag' => $task->display_tag]];
        if ($operationType === WeiboOperationType::Post) {
            $payload['content'] = $task->content;
            $payload['media_ids'] = array_map(static fn(WeiboTaskMedia $relation): int => $relation->media_id, WeiboTaskMedia::where('task_id', $task->id)->order('sort', 'asc')->select()->all());
        }
        try {
            $result = app(WeiboOperations::class)->execute($task->team_id, $task->owner_entity_id ?: null, null, $selected, $operationType, $payload, WeiboOperationSource::Schedule, $task->id, $version, $dispatchKey, $plannedAt);
        } catch (HttpException $exception) {
            if ($exception->getStatusCode() !== 409) throw $exception;
            $job->delete(); return;
        }
        if ($result['status'] === WeiboExecutionStatus::Dispatching->name) { $job->release(30); return; }
        if ($result['status'] === WeiboExecutionStatus::Unknown->name) $this->notifyUnknown($task, $result['id']);
        if ($result['status'] === WeiboExecutionStatus::Failed->name) app(Notice::class)->sendOnce($task->team_id, '微博任务执行失败', "原因：" . ($result['reason'] ?? WeiboReason::Unknown->name) . '。任务将继续下一周期。', "weibo:operation:{$result['id']}:failed");
        $this->scheduleNext($task);
        $job->delete();
    }

    private function notifyUnknown(WeiboTask $task, int|string $operationId): void
    {
        app(Notice::class)->sendOnce($task->team_id, '微博任务结果未确认', '本周期远端执行结果无法确认，请查看微博账号核对；本周期不会自动重发，任务将继续下一周期。', "weibo:operation:{$operationId}:unknown");
    }

    /** 非预期异常以退避重试兜底并告警一次；部署参数 --tries=0 下直接重抛会让 worker 立即重弹形成热循环。 */
    private function retryAbnormal(Job $job, WeiboTask $task, int $version, \Throwable $exception): void
    {
        try {
            \think\facade\Log::error('微博任务执行异常，已退避重试', [
                'task_id' => $task->id,
                'version' => $version,
                'attempts' => $job->attempts(),
                'error' => $exception->getMessage(),
                'thrown_at' => $exception->getFile() . ':' . $exception->getLine(),
            ]);
            app(Notice::class)->sendOnce($task->team_id, '微博任务执行异常', '任务调度遇到非预期异常，已自动延迟重试；若任务持续异常，请检查候选账号数据与执行日志。', "weibo:task:{$task->id}:abnormal:v{$version}");
        } finally {
            if (!$job->isDeleted() && !$job->isReleased()) $job->release(min(60 * 2 ** min(4, max(1, $job->attempts()) - 1), 900));
        }
    }

    private function scheduleNext(WeiboTask $task): void
    {
        if ($task->enumCase('operation_type') === WeiboOperationType::Checkin) {
            $next = $task->next_run_at + WeiboTasks::CHECKIN_INTERVAL;
            $now = time();
            if ($next <= $now) $next += (intdiv($now - $next, WeiboTasks::CHECKIN_INTERVAL) + 1) * WeiboTasks::CHECKIN_INTERVAL;
        } else {
            $next = time() + random_int($task->min_interval, $task->max_interval);
        }
        Db::transaction(function () use ($task, $next): void {
            if (!$this->current($task)->update(['next_run_at' => $next])) return;
            app(WeiboTasks::class)->enqueue(WeiboTask::find($task->id));
        });
    }

    private function current(WeiboTask $task): \think\db\Query
    {
        return WeiboTask::where('id', $task->id)->where('status', WeiboTaskStatus::Active->value)
            ->where('version', $task->version)->where('next_run_at', $task->next_run_at);
    }

    private function randomize(array $ids): array
    {
        for ($index = count($ids) - 1; $index > 0; $index--) {
            $swap = random_int(0, $index);
            [$ids[$index], $ids[$swap]] = [$ids[$swap], $ids[$index]];
        }
        return $ids;
    }
}
