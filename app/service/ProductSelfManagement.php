<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use think\exception\HttpException;

final class ProductSelfManagement
{
    public function list(int $teamId, array $actingEntity, array $filters, int $page, int $limit): array
    {
        $filters['entity_id'] = $this->entityId($actingEntity);
        return app(Product::class)->list($teamId, $filters, $page, $limit);
    }

    public function options(int $teamId, array $actingEntity): array
    {
        return app(EntitlementManagement::class)->personalOptions($teamId, $this->entityId($actingEntity));
    }

    public function get(int $teamId, array $actingEntity, int $id): array
    {
        $this->assertOwn($teamId, $this->entityId($actingEntity), $id);
        return app(Product::class)->get($teamId, $id);
    }

    public function create(int $teamId, array $actingEntity, int $expectedEntityId, array $data): int
    {
        $data['entity_id'] = $this->writableEntityId($actingEntity, $expectedEntityId);
        return app(Product::class)->create($teamId, $data);
    }

    public function edit(int $teamId, array $actingEntity, int $expectedEntityId, int $id, array $data): void
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        app(Product::class)->edit($teamId, $id, $data);
    }

    public function setHandlers(int $teamId, array $actingEntity, int $expectedEntityId, int $id, array $entityIds): void
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        app(Product::class)->setHandlers($teamId, $id, $entityIds);
    }

    public function fields(int $teamId, array $actingEntity, int $id): array
    {
        $this->assertOwn($teamId, $this->entityId($actingEntity), $id);
        return app(ProductRedemptionField::class)->list($teamId, $id);
    }

    public function createField(int $teamId, array $actingEntity, int $expectedEntityId, int $id, array $data): int
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        unset($data['expected_entity_id']);
        return app(ProductRedemptionField::class)->create($teamId, $id, $data);
    }

    public function updateField(int $teamId, array $actingEntity, int $expectedEntityId, int $id, int $fieldId, array $data): void
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        unset($data['expected_entity_id']);
        app(ProductRedemptionField::class)->update($teamId, $id, $fieldId, $data);
    }

    public function deleteField(int $teamId, array $actingEntity, int $expectedEntityId, int $id, int $fieldId): void
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        app(ProductRedemptionField::class)->delete($teamId, $id, $fieldId);
    }

    private function entityId(array $actingEntity): int
    {
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        if ($entityId < 1) {
            throw new HttpException(401, '当前实体身份会话已失效');
        }
        return $entityId;
    }

    private function writableEntityId(array $actingEntity, int $expectedEntityId): int
    {
        $entityId = $this->entityId($actingEntity);
        if ($expectedEntityId < 1 || $entityId !== $expectedEntityId) {
            throw new HttpException(409, '身份已切换，请重新加载后再保存');
        }
        return $entityId;
    }

    private function assertOwn(int $teamId, int $entityId, int $productId): void
    {
        if (!TeamProduct::where('team_id', $teamId)
            ->where('entity_id', $entityId)
            ->find($productId)) {
            throw new HttpException(404, '商品不存在');
        }
    }
}
