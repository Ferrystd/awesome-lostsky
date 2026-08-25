<?php
declare(strict_types=1);

namespace app\service;

use app\enum\WeiboExecutionStatus;
use app\enum\WeiboOperationSource;
use app\enum\WeiboOperationType;
use app\enum\WeiboReason;
use app\model\WeiboMedia;
use app\model\WeiboOperationLog;
use think\facade\Db;

final class WeiboOperations
{
    public function execute(
        int $teamId,
        ?int $ownerEntityId,
        ?int $actorEntityId,
        int $accountId,
        WeiboOperationType $type,
        array $payload,
        WeiboOperationSource $source = WeiboOperationSource::Manual,
        ?int $taskId = null,
        ?int $taskVersion = null,
        ?string $dispatchKey = null
    ): array {
        if (!app(AbilityResolver::class)->available($teamId, 'weibo')) throw \app\exception\AccessDeniedException::ability('weibo', '微博');
        $dispatchKey ??= 'manual:' . bin2hex(random_bytes(20));
        $existing = WeiboOperationLog::where('dispatch_key', $dispatchKey)->find();
        if ($existing) return $this->dto($existing);
        $content = $this->optionalText($payload, 'content');
        $mediaIds = $this->integerIds($payload['media_ids'] ?? []);
        $topic = in_array($type, [WeiboOperationType::Post, WeiboOperationType::Checkin], true) ? $this->topic($payload) : null;
        $contentSummary = $type === WeiboOperationType::Checkin ? ($topic['display_tag'] ?? $topic['name'] ?? null) : $content;
        $targetId = $type === WeiboOperationType::Checkin ? null : ($payload['status_id'] ?? null);
        $log = Db::transaction(function () use ($dispatchKey, $teamId, $ownerEntityId, $actorEntityId, $accountId, $taskId, $taskVersion, $type, $source, $contentSummary, $targetId, $mediaIds, $payload): WeiboOperationLog {
            $log = new WeiboOperationLog;
            $log->save([
                'dispatch_key' => $dispatchKey, 'team_id' => $teamId, 'owner_entity_id' => $ownerEntityId,
                'actor_entity_id' => $actorEntityId, 'account_id' => $accountId, 'task_id' => $taskId,
                'task_version' => $taskVersion, 'operation_type' => $type->value, 'source' => $source->value,
                'status' => WeiboExecutionStatus::Dispatching->value, 'target_id' => $targetId,
                'content_summary' => $contentSummary === null ? null : mb_substr(trim($contentSummary), 0, 120),
                'media_summary' => isset($payload['media_ids']) ? ['count' => count($mediaIds), 'ids' => $mediaIds] : null,
                'started_at' => time(),
            ]);
            return $log;
        });
        $account = app(WeiboAccounts::class)->bound($teamId, $ownerEntityId ?? $actorEntityId ?? 0, $accountId, $ownerEntityId === null);
        try {
            $protocol = app(WeiboProtocol::class);
            $result = match ($type) {
                WeiboOperationType::Post => $protocol->post($account, $topic, $this->requiredText($payload, 'content'), $this->pids($teamId, $ownerEntityId, $mediaIds)),
                WeiboOperationType::Like => $protocol->like($account, $this->requiredText($payload, 'status_id')),
                WeiboOperationType::Comment => $protocol->comment($account, $this->requiredText($payload, 'status_id'), $this->requiredText($payload, 'comment')),
                WeiboOperationType::Checkin => $protocol->checkin($account, $topic),
            };
            $log->save([
                'status' => ($result['success'] ? WeiboExecutionStatus::Succeeded : WeiboExecutionStatus::Failed)->value,
                'reason' => $result['reason']->value, 'remote_code' => $result['code'],
                'remote_message' => mb_substr($result['message'], 0, 255), 'http_status' => $result['http_status'],
                'remote_status_id' => $result['status_id'] ?? null, 'remote_comment_id' => $result['comment_id'] ?? null,
                'finished_at' => time(),
            ]);
        } catch (\Throwable $exception) {
            $reason = $exception instanceof \app\exception\WeiboRemoteException ? $exception->reason : WeiboReason::Unknown;
            $log->save(['status' => WeiboExecutionStatus::Unknown->value, 'reason' => $reason->value, 'remote_code' => $exception instanceof \app\exception\WeiboRemoteException ? $exception->remoteCode : null, 'remote_message' => mb_substr($exception->getMessage(), 0, 255), 'http_status' => $exception instanceof \app\exception\WeiboRemoteException ? $exception->httpStatus : null, 'finished_at' => time()]);
        }
        return $this->dto($log);
    }

    public function list(int $teamId, int $entityId, bool $teamScope, int $page = 1, int $limit = 20): array
    {
        $limit = max(1, min(100, $limit)); $page = max(1, $page);
        $query = WeiboOperationLog::where('team_id', $teamId)->where('create_time', '>=', time() - 30 * 86400);
        if (!$teamScope) $query->where('owner_entity_id', $entityId);
        $total = (clone $query)->count();
        return ['list' => array_map(fn(WeiboOperationLog $log) => $this->dto($log), $query->order('id', 'desc')->page($page, $limit)->select()->all()), 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function dto(WeiboOperationLog $log): array
    {
        return [
            'id' => $log->id, 'dispatch_key' => $log->dispatch_key,
            'owner_entity_id' => $log->owner_entity_id ?: null,
            'account_id' => $log->account_id ?: null, 'task_id' => $log->task_id ?: null,
            'operation_type' => $log->enumCase('operation_type')->name, 'source' => $log->enumCase('source')->name,
            'status' => $log->enumCase('status')->name, 'target_id' => $log->target_id ?: null,
            'content_summary' => $log->content_summary ?: null, 'media_summary' => $log->media_summary,
            'remote_status_id' => $log->remote_status_id ?: null, 'remote_comment_id' => $log->remote_comment_id ?: null,
            'reason' => $log->reason ? $log->enumCase('reason')->name : null, 'remote_code' => $log->remote_code ?: null,
            'remote_message' => $log->remote_message ?: null, 'http_status' => $log->http_status ?: null,
            'started_at' => $log->started_at, 'finished_at' => $log->finished_at ?: null,
        ];
    }

    private function pids(int $teamId, ?int $ownerEntityId, array $ids): array
    {
        if (count($ids) > 9) throw new \InvalidArgumentException('每条微博最多 9 张图片');
        if (!$ids) return [];
        $query = WeiboMedia::where('team_id', $teamId)->whereIn('id', $ids);
        if ($ownerEntityId !== null) $query->where('owner_entity_id', $ownerEntityId);
        $media = $query->select();
        if (count($media) !== count($ids)) throw new \InvalidArgumentException('存在不可用的微博媒体');
        $byId = []; foreach ($media as $item) $byId[$item->id] = $item->pid;
        return array_map(static fn(int $id): string => $byId[$id], $ids);
    }

    /** @return list<int> */
    private function integerIds(mixed $value): array
    {
        if (!is_array($value)) throw new \InvalidArgumentException('媒体参数无效');
        foreach ($value as $id) if (!is_int($id) || $id < 1) throw new \InvalidArgumentException('媒体参数无效');
        return array_values(array_unique($value));
    }

    private function optionalText(array $payload, string $key): ?string
    {
        if (!array_key_exists($key, $payload)) return null;
        if (!is_string($payload[$key])) throw new \InvalidArgumentException("参数 {$key} 无效");
        return $payload[$key];
    }

    private function requiredText(array $payload, string $key): string
    {
        $value = $this->optionalText($payload, $key);
        if ($value === null) throw new \InvalidArgumentException("缺少参数 {$key}");
        return $value;
    }

    private function topic(array $payload): array
    {
        $topic = $payload['topic'] ?? null;
        if (!is_array($topic)) throw new \InvalidArgumentException('超话参数无效');
        return $topic;
    }
}
