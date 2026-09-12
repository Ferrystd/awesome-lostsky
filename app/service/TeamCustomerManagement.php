<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use app\model\TeamCustomerSender;
use app\model\TeamOrder;
use app\model\TeamTransaction;
use think\exception\HttpException;
use think\facade\Db;

class TeamCustomerManagement
{
    public function listing(
        int $teamId,
        array $actingEntity,
        array $filters,
        int $page,
        int $limit
    ): array {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $canReadAll = $this->canReadAll($teamId, $actingEntity);
        $query = TeamCustomer::alias('c')
            ->leftJoin('entity ce', "ce.entityable_type = 'teamCustomer' AND ce.entityable_id = c.id")
            ->leftJoin('team_entity_profile cp', 'cp.entity_id = ce.id')
            ->leftJoin('team_customer_balance b', 'b.customer_id = c.id')
            ->leftJoin('entity ae', 'ae.id = c.assignee_entity_id')
            ->leftJoin('team_entity_profile ap', 'ap.entity_id = ae.id')
            ->where('c.team_id', $teamId);

        if (!$canReadAll) {
            $query->where('c.assignee_entity_id', (int) ($actingEntity['entity_id'] ?? 0));
        }
        if (($filters['keyword'] ?? '') !== '') {
            $query->where('cp.name', 'like', '%' . trim((string) $filters['keyword']) . '%');
        }
        if (array_key_exists('assignee_entity_id', $filters)
            && $filters['assignee_entity_id'] !== null
            && $filters['assignee_entity_id'] !== '') {
            $assigneeId = (int) $filters['assignee_entity_id'];
            $assigneeId > 0
                ? $query->where('c.assignee_entity_id', $assigneeId)
                : $query->whereNull('c.assignee_entity_id');
        }
        if (($filters['blocked'] ?? null) !== null && $filters['blocked'] !== '') {
            $query->where('c.is_blocked', (int) ((bool) $filters['blocked']));
        }

        $paginator = $query->field([
            'c.id', 'c.assignee_entity_id', 'c.is_blocked', 'c.create_time', 'c.update_time',
            'ce.id as entity_id', 'ce.slug', 'cp.name', 'cp.avatar', 'cp.description',
            'b.balance', 'b.recharged', 'b.spent',
            'ae.slug as assignee_slug', 'ae.entityable_type as assignee_type',
            'ap.name as assignee_name', 'ap.avatar as assignee_avatar',
        ])->order('c.id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection()->toArray();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();

        $list = array_map(fn (array $row): array => $this->row($row), $rows);
        return [
            'total' => $total,
            'list' => $list,
            'page' => $page,
            'limit' => $limit,
            'scope' => $canReadAll ? 'all' : 'own',
        ];
    }

    public function personalListing(
        int $teamId,
        int $entityId,
        array $filters,
        int $page,
        int $limit
    ): array {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $bindingIds = array_map('intval', TeamCustomerSender::where('team_id', $teamId)
            ->where('entity_id', $entityId)
            ->column('customer_id'));
        $bindingSet = array_fill_keys($bindingIds, true);
        $query = TeamCustomer::alias('c')
            ->leftJoin('entity ce', "ce.entityable_type = 'teamCustomer' AND ce.entityable_id = c.id")
            ->leftJoin('team_entity_profile cp', 'cp.entity_id = ce.id')
            ->leftJoin('team_customer_balance b', 'b.customer_id = c.id')
            ->leftJoin('entity ae', 'ae.id = c.assignee_entity_id')
            ->leftJoin('team_entity_profile ap', 'ap.entity_id = ae.id')
            ->where('c.team_id', $teamId)
            ->where(function ($scope) use ($entityId, $bindingIds): void {
                $scope->where('c.assignee_entity_id', $entityId);
                if ($bindingIds) {
                    $scope->whereOr('c.id', 'in', $bindingIds);
                }
            });

        if (($filters['keyword'] ?? '') !== '') {
            $query->where('cp.name', 'like', '%' . trim((string) $filters['keyword']) . '%');
        }

        $paginator = $query->field([
            'c.id', 'c.assignee_entity_id', 'c.is_blocked', 'c.create_time', 'c.update_time',
            'ce.id as entity_id', 'ce.slug', 'cp.name', 'cp.avatar', 'cp.description',
            'b.balance', 'b.recharged', 'b.spent',
            'ae.slug as assignee_slug', 'ae.entityable_type as assignee_type',
            'ap.name as assignee_name', 'ap.avatar as assignee_avatar',
        ])->order('c.id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection()->toArray();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();

        $list = array_map(function (array $row) use ($entityId, $bindingSet): array {
            $customer = $this->row($row);
            $customer['is_assignee'] = (int) ($row['assignee_entity_id'] ?? 0) === $entityId;
            $customer['is_sender'] = isset($bindingSet[(int) $row['id']]);
            return $customer;
        }, $rows);

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, array $actingEntity, int $customerId): array
    {
        $canReadAll = $this->canReadAll($teamId, $actingEntity);
        $query = TeamCustomer::alias('c')
            ->leftJoin('entity ce', "ce.entityable_type = 'teamCustomer' AND ce.entityable_id = c.id")
            ->leftJoin('team_entity_profile cp', 'cp.entity_id = ce.id')
            ->leftJoin('team_customer_balance b', 'b.customer_id = c.id')
            ->leftJoin('entity ae', 'ae.id = c.assignee_entity_id')
            ->leftJoin('team_entity_profile ap', 'ap.entity_id = ae.id')
            ->where('c.team_id', $teamId)
            ->where('c.id', $customerId);
        if (!$canReadAll) {
            $query->where('c.assignee_entity_id', (int) ($actingEntity['entity_id'] ?? 0));
        }
        $row = $query->field([
            'c.id', 'c.assignee_entity_id', 'c.is_blocked', 'c.create_time', 'c.update_time',
            'ce.id as entity_id', 'ce.slug', 'cp.name', 'cp.avatar', 'cp.description',
            'b.balance', 'b.recharged', 'b.spent',
            'ae.slug as assignee_slug', 'ae.entityable_type as assignee_type',
            'ap.name as assignee_name', 'ap.avatar as assignee_avatar',
        ])->find();
        if (!$row) {
            throw new HttpException(404, '顾客不存在');
        }

        $result = $this->row($row->toArray());
        $transaction = TeamTransaction::where('team_id', $teamId)
            ->where('customer_id', $customerId)
            ->field([
                'COUNT(*) as count',
                'COALESCE(SUM(total_price), 0) as total_price',
            ])->find();
        $orders = TeamOrder::where('team_id', $teamId)
            ->where('customer_id', $customerId)
            ->field([
                'COUNT(*) as count',
                'COALESCE(SUM(total_price), 0) as total_price',
            ])->find();
        $result['summary'] = [
            'transaction_count' => (int) ($transaction?->count ?? 0),
            'transaction_total' => (string) ($transaction?->total_price ?? '0.00'),
            'order_count' => (int) ($orders?->count ?? 0),
            'order_total' => (string) ($orders?->total_price ?? '0.00'),
        ];
        $result['senders'] = $this->senders($teamId, $customerId);
        $result['can_manage'] = $this->canManage($teamId, $actingEntity);
        return $result;
    }

    public function update(int $teamId, int $customerId, array $data): void
    {
        Db::transaction(function () use ($teamId, $customerId, $data): void {
            $customer = app(CustomerAssignment::class)->customer($teamId, $customerId, true);
            $entity = \app\model\Entity::where('entityable_type', 'teamCustomer')
                ->where('entityable_id', $customerId)
                ->find();
            if (!$entity) {
                throw new HttpException(404, '顾客身份不存在');
            }
            $customerChanged = false;
            if (array_key_exists('assignee_entity_id', $data)) {
                $assigneeId = $data['assignee_entity_id'] === null || $data['assignee_entity_id'] === ''
                    ? null
                    : (int) $data['assignee_entity_id'];
                if ($assigneeId) {
                    app(CustomerAssignment::class)->assertEntity($teamId, $assigneeId);
                }
                $customer->assignee_entity_id = $assigneeId;
                $customerChanged = true;
            }
            if (array_key_exists('is_blocked', $data)) {
                $customer->is_blocked = (int) ((bool) $data['is_blocked']);
                $customerChanged = true;
            }
            if ($customerChanged) {
                $customer->save();
            }

            if (array_key_exists('sender_entity_ids', $data)) {
                $this->syncSenders($teamId, $customerId, (array) $data['sender_entity_ids']);
            }

            $profile = [];
            foreach (['name', 'avatar', 'description'] as $field) {
                if (array_key_exists($field, $data)) {
                    $profile[$field] = $data[$field];
                }
            }
            app(EntityProfile::class)->update($teamId, (int) $entity->id, $profile);
        });
    }

    public function assignees(int $teamId): array
    {
        return app(CustomerAssignment::class)->options($teamId);
    }

    private function canReadAll(int $teamId, array $actingEntity): bool
    {
        return app(PermissionGate::class)->allows($teamId, $actingEntity, [
            PermissionDictionary::TEAM_CUSTOMER_READ,
            PermissionDictionary::TEAM_CUSTOMER_MANAGE,
        ]);
    }

    private function canManage(int $teamId, array $actingEntity): bool
    {
        return app(PermissionGate::class)->allows($teamId, $actingEntity, [
            PermissionDictionary::TEAM_CUSTOMER_MANAGE,
        ]);
    }

    private function senders(int $teamId, int $customerId): array
    {
        return TeamCustomerSender::alias('s')
            ->join('entity e', 'e.id = s.entity_id')
            ->leftJoin('team_entity_profile p', 'p.entity_id = e.id')
            ->where('s.team_id', $teamId)
            ->where('s.customer_id', $customerId)
            ->field([
                'e.id as entity_id', 'e.slug', 'e.entityable_type as type',
                'p.name', 'p.avatar',
            ])
            ->order('s.id', 'asc')
            ->select()
            ->map(static fn ($item): array => [
                'entity_id' => (int) $item->entity_id,
                'slug' => (string) $item->slug,
                'type' => (string) $item->type,
                'name' => (string) ($item->name ?: $item->slug),
                'avatar' => $item->avatar ?: null,
            ])
            ->toArray();
    }

    private function syncSenders(int $teamId, int $customerId, array $entityIds): void
    {
        $desired = [];
        foreach ($entityIds as $entityId) {
            $entityId = (int) $entityId;
            if ($entityId < 1) {
                throw new HttpException(422, '协作发单人不正确');
            }
            if (isset($desired[$entityId])) {
                throw new HttpException(422, '协作发单人不能重复');
            }
            app(CustomerAssignment::class)->assertEntity($teamId, $entityId);
            $desired[$entityId] = true;
        }

        $bindings = TeamCustomerSender::withTrashed()
            ->where('team_id', $teamId)
            ->where('customer_id', $customerId)
            ->lock(true)
            ->select();
        foreach ($bindings as $binding) {
            $entityId = (int) $binding->entity_id;
            if (isset($desired[$entityId])) {
                if ($binding->trashed()) {
                    $binding->restore();
                }
                unset($desired[$entityId]);
            } elseif (!$binding->trashed()) {
                $binding->delete();
            }
        }

        foreach (array_keys($desired) as $entityId) {
            TeamCustomerSender::create([
                'team_id' => $teamId,
                'customer_id' => $customerId,
                'entity_id' => $entityId,
            ]);
        }
    }

    private function row(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'entity_id' => (int) ($row['entity_id'] ?? 0),
            'slug' => (string) ($row['slug'] ?? ''),
            'name' => (string) ($row['name'] ?: $row['slug'] ?: "顾客 #{$row['id']}"),
            'avatar' => $row['avatar'] ?: null,
            'description' => $row['description'] ?: null,
            'is_blocked' => (bool) $row['is_blocked'],
            'create_time' => (int) $row['create_time'],
            'update_time' => (int) $row['update_time'],
            'balance' => [
                'balance' => (string) ($row['balance'] ?? '0.00'),
                'recharged' => (string) ($row['recharged'] ?? '0.00'),
                'spent' => (string) ($row['spent'] ?? '0.00'),
            ],
            'assignee' => empty($row['assignee_entity_id']) ? null : [
                'entity_id' => (int) $row['assignee_entity_id'],
                'slug' => (string) ($row['assignee_slug'] ?? ''),
                'type' => (string) ($row['assignee_type'] ?? ''),
                'name' => (string) ($row['assignee_name'] ?: $row['assignee_slug'] ?: '未知归属人'),
                'avatar' => $row['assignee_avatar'] ?: null,
            ],
        ];
    }
}
