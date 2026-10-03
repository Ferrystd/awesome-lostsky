<?php
declare(strict_types=1);

namespace app\service;

use app\enum\WeiboOperationType;
use app\enum\WeiboTaskStatus;
use app\model\WeiboMedia;
use app\model\WeiboTask;
use app\model\WeiboTaskAccount;
use app\model\WeiboTaskMedia;
use think\exception\HttpException;
use think\facade\Db;
use think\facade\Queue;

final class WeiboTasks
{
    public const QUEUE = 'weibo-schedule';
    public const CHECKIN_INTERVAL = 86400;

    public function list(int $teamId, int $entityId, bool $teamScope): array
    {
        $query = WeiboTask::where('team_id', $teamId);
        if (!$teamScope) $query->where('owner_entity_id', $entityId);
        return array_map(fn(WeiboTask $task) => $this->dto($task), $query->order('id', 'desc')->select()->all());
    }

    public function get(int $teamId, int $entityId, int $id, bool $teamScope): array
    {
        return $this->dto($this->find($teamId, $entityId, $id, $teamScope));
    }

    public function create(int $teamId, int $actorEntityId, ?int $ownerEntityId, array $data): array
    {
        if ($ownerEntityId === null) {
            $actor = \app\model\Entity::find($actorEntityId);
            if (!$actor || !$actor->is_valid) throw new HttpException(422, '当前人员身份不存在或不可用');
        } else {
            app(Entity::class)->assertInTeam($actorEntityId, $teamId);
        }
        if ($ownerEntityId !== null) app(Entity::class)->assertInTeam($ownerEntityId, $teamId);
        $clean = $this->validate($teamId, $ownerEntityId ?? $actorEntityId, $ownerEntityId === null, $data);
        $task = Db::transaction(function () use ($teamId, $actorEntityId, $ownerEntityId, $clean): WeiboTask {
            $task = new WeiboTask;
            $task->save($clean['task'] + ['team_id' => $teamId, 'owner_entity_id' => $ownerEntityId, 'creator_entity_id' => $actorEntityId, 'status' => WeiboTaskStatus::Paused->value, 'block_reason' => null, 'next_run_at' => null, 'version' => 1]);
            $this->syncRelations($task->id, $clean['account_ids'], $clean['media_ids']);
            return $task;
        });
        return $this->dto($task);
    }

    public function edit(int $teamId, int $entityId, int $id, bool $teamScope, array $data): array
    {
        $task = $this->find($teamId, $entityId, $id, $teamScope);
        if (($data['expected_version'] ?? null) !== $task->version) throw new HttpException(409, '任务已更新，请刷新后重试');
        if ($task->enumCase('status') === WeiboTaskStatus::Cancelled) throw new HttpException(409, '已取消任务不能编辑');
        $scopeEntity = $task->owner_entity_id ?: $entityId;
        $clean = $this->validate($teamId, $scopeEntity, $teamScope, $data);
        Db::transaction(function () use ($task, $clean): void {
            $current = WeiboTask::where('id', $task->id)->lock(true)->find();
            if (!$current || $current->version !== $task->version || $current->enumCase('status') === WeiboTaskStatus::Cancelled) throw new HttpException(409, '任务已更新，请刷新后重试');
            $task->save($clean['task'] + ['status' => WeiboTaskStatus::Paused->value, 'block_reason' => null, 'next_run_at' => null, 'version' => $task->version + 1]);
            $this->syncRelations($task->id, $clean['account_ids'], $clean['media_ids']);
        });
        return $this->dto($task->refresh());
    }

    public function transition(int $teamId, int $entityId, int $id, bool $teamScope, string $action): array
    {
        if (in_array($action, ['start', 'resume'], true) && !app(AbilityResolver::class)->available($teamId, 'weibo')) throw \app\exception\AccessDeniedException::ability('weibo', '微博');
        return Db::transaction(function () use ($teamId, $entityId, $id, $teamScope, $action): array {
            $task = $this->find($teamId, $entityId, $id, $teamScope, true);
            $status = $task->enumCase('status');
            if ($action === 'cancel') $next = WeiboTaskStatus::Cancelled;
            elseif ($action === 'pause') $next = WeiboTaskStatus::Paused;
            elseif (in_array($action, ['start', 'resume'], true)) {
                if ($status === WeiboTaskStatus::Cancelled) throw new HttpException(409, '已取消任务不能恢复');
                $next = WeiboTaskStatus::Active;
            } else throw new HttpException(422, '不支持的任务操作');
            $version = $task->version + 1;
            $nextRun = $next === WeiboTaskStatus::Active ? max(time(), $task->start_at) : null;
            $task->save(['status' => $next->value, 'block_reason' => null, 'next_run_at' => $nextRun, 'version' => $version]);
            if ($next === WeiboTaskStatus::Active) $this->enqueue($task);
            return $this->dto($task);
        });
    }

    public function enqueue(WeiboTask $task): void
    {
        if (config('queue.connections.database.type') !== 'database' || config('queue.connections.database.connection') !== null) throw new \RuntimeException('微博调度必须使用业务数据库的 database 队列');
        if (!Queue::connection('database')->later(max(0, $task->next_run_at - time()), 'RunWeiboTask', ['task_id' => $task->id, 'version' => $task->version, 'planned_at' => $task->next_run_at], self::QUEUE)) throw new \RuntimeException('微博任务入队失败');
    }

    /** 补投缺失 Job，保持原 dispatch key，远端写入仍由 Worker 防重。 */
    public function recover(?int $taskId = null): int
    {
        $count = 0;
        $query = WeiboTask::where('status', WeiboTaskStatus::Active->value)->whereNotNull('next_run_at');
        if ($taskId !== null) $query->where('id', $taskId);
        $query->order('id')->chunk(200, function ($tasks) use (&$count): void {
            foreach ($tasks as $snapshot) {
                $count += Db::transaction(function () use ($snapshot): int {
                    $task = WeiboTask::where('id', $snapshot->id)->lock(true)->find();
                    if (!$task || $task->enumCase('status') !== WeiboTaskStatus::Active || !$task->next_run_at) return 0;
                    $exists = Db::name(config('queue.connections.database.table'))->where('queue', self::QUEUE)
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.job')) = ?", ['RunWeiboTask'])
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.task_id')) = ?", [$task->id])
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.version')) = ?", [$task->version])
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.planned_at')) = ?", [$task->next_run_at])->find();
                    if ($exists) return 0;
                    $this->enqueue($task);
                    return 1;
                });
            }
        });
        return $count;
    }

    public function dto(WeiboTask $task): array
    {
        return [
            'id' => $task->id, 'team_id' => $task->team_id,
            'owner_entity_id' => $task->owner_entity_id ?: null,
            'operation_type' => $task->enumCase('operation_type')->name,
            'topic' => ['name' => $task->topic_name, 'container_id' => $task->container_id, 'topic_id' => $task->topic_id, 'display_tag' => $task->display_tag],
            'content' => $task->content, 'start_at' => $task->start_at,
            'min_interval' => $task->min_interval, 'max_interval' => $task->max_interval,
            'account_ids' => array_map(static fn(WeiboTaskAccount $relation): int => $relation->account_id, WeiboTaskAccount::where('task_id', $task->id)->select()->all()),
            'media_ids' => array_map(static fn(WeiboTaskMedia $relation): int => $relation->media_id, WeiboTaskMedia::where('task_id', $task->id)->order('sort', 'asc')->select()->all()),
            'version' => $task->version, 'status' => $task->enumCase('status')->name,
            'block_reason' => $task->block_reason ?: null, 'next_run_at' => $task->next_run_at ?: null,
        ];
    }

    private function validate(int $teamId, int $scopeEntityId, bool $teamScope, array $data): array
    {
        $type = match ($data['operation_type'] ?? null) {
            WeiboOperationType::Post->name => WeiboOperationType::Post,
            WeiboOperationType::Checkin->name => WeiboOperationType::Checkin,
            default => throw new HttpException(422, '任务类型无效'),
        };
        $content = $data['content'] ?? null;
        $topicName = $data['topic'] ?? $data['topic_name'] ?? null;
        $min = $type === WeiboOperationType::Checkin ? self::CHECKIN_INTERVAL : ($data['min_interval'] ?? null);
        $max = $type === WeiboOperationType::Checkin ? self::CHECKIN_INTERVAL : ($data['max_interval'] ?? null);
        $start = $data['start_at'] ?? null;
        $accountIds = $this->integerIds($data['account_ids'] ?? null);
        $mediaIds = $this->integerIds($data['media_ids'] ?? null);
        if (!is_string($content) || !is_string($topicName) || !is_int($min) || !is_int($max) || !is_int($start)) throw new HttpException(422, '任务参数无效');
        $content = trim($content);
        $topicName = trim($topicName);
        if ($topicName === '' || $start < 1 || $min < 1 || $max < $min || !$accountIds || count($mediaIds) > 9) throw new HttpException(422, '任务参数无效');
        if ($type === WeiboOperationType::Post && $content === '') throw new HttpException(422, '发帖任务正文不能为空');
        if ($type === WeiboOperationType::Checkin && ($content !== '' || $mediaIds)) throw new HttpException(422, '签到任务不能包含正文或图片');
        foreach ($accountIds as $accountId) app(WeiboAccounts::class)->bound($teamId, $scopeEntityId, $accountId, $teamScope);
        $mediaQuery = WeiboMedia::where('team_id', $teamId)->whereIn('id', $mediaIds);
        if (!$teamScope) $mediaQuery->where('owner_entity_id', $scopeEntityId);
        if ($mediaIds && $mediaQuery->count() !== count($mediaIds)) throw new HttpException(422, '任务包含不可用的媒体');
        $topic = app(WeiboProtocol::class)->resolveSupertopic($topicName);
        return ['task' => ['operation_type' => $type->value, 'topic_name' => $topic['name'], 'container_id' => $topic['container_id'], 'topic_id' => $topic['topic_id'], 'display_tag' => $topic['display_tag'], 'content' => $content, 'start_at' => $start, 'min_interval' => $min, 'max_interval' => $max], 'account_ids' => $accountIds, 'media_ids' => $mediaIds];
    }

    /** @return list<int> */
    private function integerIds(mixed $value): array
    {
        if (!is_array($value)) return [];
        foreach ($value as $id) if (!is_int($id) || $id < 1) throw new HttpException(422, '任务参数无效');
        return array_values(array_unique($value));
    }

    private function syncRelations(int $taskId, array $accounts, array $media): void
    {
        WeiboTaskAccount::destroy(fn($query) => $query->where('task_id', $taskId), true);
        WeiboTaskMedia::destroy(fn($query) => $query->where('task_id', $taskId), true);
        foreach ($accounts as $id) (new WeiboTaskAccount)->save(['task_id' => $taskId, 'account_id' => $id]);
        foreach ($media as $sort => $id) (new WeiboTaskMedia)->save(['task_id' => $taskId, 'media_id' => $id, 'sort' => $sort]);
    }

    private function find(int $teamId, int $entityId, int $id, bool $teamScope, bool $lock = false): WeiboTask
    {
        $query = WeiboTask::where('team_id', $teamId)->where('id', $id);
        if (!$teamScope) $query->where('owner_entity_id', $entityId);
        $task = $query->lock($lock)->find();
        if (!$task) throw new HttpException(404, '微博任务不存在');
        return $task;
    }
}
