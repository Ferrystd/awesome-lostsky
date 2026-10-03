<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;

final class ChatIdentity
{
    public function expected(array $actingEntity, int $expectedEntityId): int
    {
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        if ($expectedEntityId < 1 || $entityId !== $expectedEntityId) {
            throw new HttpException(409, '身份已切换，请重新加载后再操作');
        }
        $entity = \app\model\Entity::find($entityId);
        if (!$entity || !$entity->is_valid) {
            throw new HttpException(401, '当前人员身份会话已失效');
        }
        return $entityId;
    }
}
