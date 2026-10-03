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
        $task = WeiboTask::find($taskId);
        if (!$task || $task->enumCase('status') !== WeiboTaskStatus::Active || $task->version !== $version || $task->next_run_at !== $plannedAt) { $job->delete(); return; }
        if (!app(AbilityResolver::class)->available($task->team_id, 'weibo')) {
            if (!$this->current($task)->update(['status' => WeiboTaskStatus::BlockedAbility->value, 'block_reason' => 'ability_missing', 'next_run_at' => null, 'version' => $version + 1])) { $job->delete(); return; }
            app(Notice::class)->sendOnce($task->team_id, '微博任务已阻塞', '团队缺少微博 Ability，续期后请手动恢复任务。', "weibo:task:{$task->id}:blocked-ability:v{$version}");
            $job->delete(); return;
        }
        $dispatchKey = "task:{$task->id}:v{$version}:at{$plannedAt}";
        $existing = WeiboOperationLog::where('dispatch_key', $dispatchKey)->find();
        if ($existing) {
            if ($existing->enumCase('status') === WeiboExecutionStatus::Dispatching) $existing->save(['status' => WeiboExecutionStatus::Unknown->value, 'reason' => WeiboReason::Unknown->value, 'remote_message' => '执行进程在远程请求后未回写结果', 'finished_at' => time()]);
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
        $ids = $this->randomize(array_map(static fn(WeiboTaskAccount $relation): int => $relation->account_id, WeiboTaskAccount::where('task_id', $task->id)->select()->all()));
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
        if ($result['status'] !== WeiboExecutionStatus::Succeeded->name) app(Notice::class)->sendOnce($task->team_id, '微博任务执行失败', "原因：" . ($result['reason'] ?? WeiboReason::Unknown->name) . '。任务将继续下一周期。', "weibo:operation:{$result['id']}:failed");
        $this->scheduleNext($task);
        $job->delete();
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
