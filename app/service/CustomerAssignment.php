<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity as EntityModel;
use app\model\TeamCustomer;
use think\exception\HttpException;

class CustomerAssignment
{
    private const ALLOWED_TYPES = ['team', 'teamMember', 'teamVirtual'];

    public function resolveInviter(int $teamId, ?string $slug): ?EntityModel
    {
        $slug = strtolower(trim((string) $slug));
        if ($slug === '' || !preg_match('/^[a-z][a-z0-9_-]{1,49}$/D', $slug)) {
            return null;
        }

        $entity = EntityModel::where('slug', $slug)->find();
        if (!$entity) {
            return null;
        }

        try {
            return $this->assertEntity($teamId, (int) $entity->id);
        } catch (HttpException) {
            return null;
        }
    }

    public function assertEntity(int $teamId, int $entityId): EntityModel
    {
        $entity = app(Entity::class)->assertInTeam($entityId, $teamId);
        if (!in_array((string) $entity->entityable_type, self::ALLOWED_TYPES, true)) {
            throw new HttpException(422, '归属人类型不正确');
        }

        return $entity;
    }

    public function customer(int $teamId, int $customerId, bool $lock = false): TeamCustomer
    {
        $query = TeamCustomer::where('team_id', $teamId);
        if ($lock) {
            $query->lock(true);
        }
        $customer = $query->find($customerId);
        if (!$customer) {
            throw new HttpException(422, '客户不存在');
        }

        return $customer;
    }

    public function sender(TeamCustomer $customer, int $teamId): ?int
    {
        $entityId = (int) ($customer->assignee_entity_id ?? 0);
        if ($entityId < 1) {
            return null;
        }

        try {
            return (int) $this->assertEntity($teamId, $entityId)->id;
        } catch (HttpException) {
            throw new HttpException(422, '客户归属人不可用，请先修改归属');
        }
    }

    public function options(int $teamId): array
    {
        return array_values(array_filter(
            app(Entity::class)->optionsForTeam($teamId, true),
            static fn (array $item): bool => in_array(
                (string) ($item['type'] ?? ''),
                self::ALLOWED_TYPES,
                true
            )
        ));
    }
}
