<?php
declare(strict_types=1);

namespace app\service;

use app\model\ChatEntityBlock;
use think\exception\HttpException;

final class ChatBlock
{
    public function list(array $actingEntity): array
    {
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        return array_map(
            fn ($row): array => array_merge(
                app(ChatActor::class)->summaryEntity((int) $row->blocked_entity_id),
                ['blocked_at' => (int) $row->create_time]
            ),
            ChatEntityBlock::where('blocker_entity_id', $entityId)->select()->all()
        );
    }

    public function create(array $actingEntity, int $expectedEntityId, string $slug): void
    {
        $sourceId = app(ChatIdentity::class)->expected($actingEntity, $expectedEntityId);
        $target = app(ChatActor::class)->resolveGlobal($slug, false);
        if ($sourceId === (int) $target['entity_id']) {
            throw new HttpException(422, '不能屏蔽当前人员');
        }
        $row = ChatEntityBlock::withTrashed()->where('blocker_entity_id', $sourceId)
            ->where('blocked_entity_id', $target['entity_id'])->find();
        if (!$row) {
            $row = app(ChatEntityBlock::class, [], true);
        }
        $row->save(['blocker_entity_id' => $sourceId, 'blocked_entity_id' => $target['entity_id'], 'delete_time' => null]);
    }

    public function delete(array $actingEntity, int $expectedEntityId, string $slug): void
    {
        $sourceId = app(ChatIdentity::class)->expected($actingEntity, $expectedEntityId);
        $target = app(ChatActor::class)->resolveGlobal($slug, false);
        $row = ChatEntityBlock::where('blocker_entity_id', $sourceId)
            ->where('blocked_entity_id', $target['entity_id'])->find();
        if ($row) {
            $row->delete();
        }
    }

    public function blockedEitherWay(int $left, int $right): bool
    {
        return (bool) ChatEntityBlock::where(function ($query) use ($left, $right) {
            $query->where(function ($query) use ($left, $right) {
                $query->where('blocker_entity_id', $left)->where('blocked_entity_id', $right);
            })->whereOr(function ($query) use ($left, $right) {
                $query->where('blocker_entity_id', $right)->where('blocked_entity_id', $left);
            });
        })->find();
    }
}
