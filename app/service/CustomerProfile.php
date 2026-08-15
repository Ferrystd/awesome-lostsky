<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity as EntityModel;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamEntityProfile;
use think\exception\HttpException;

class CustomerProfile
{
    public function get(int $teamId, int $customerId): array
    {
        $customer = $this->customer($teamId, $customerId);
        $identity = EntityModel::customer()
            ->where('entityable_id', $customer->id)
            ->find();
        $profile = $identity
            ? TeamEntityProfile::where('entity_id', $identity->id)->find()
            : null;
        $balance = TeamCustomerBalance::where('customer_id', $customer->id)->find();
        $assignee = $customer->assignee_entity_id
            ? EntityModel::with(['profile'])->find((int) $customer->assignee_entity_id)
            : null;

        return [
            'id' => (int) $customer->id,
            'team_id' => (int) $customer->team_id,
            'is_blocked' => (int) $customer->is_blocked,
            'profile' => [
                'name' => (string) ($profile?->name ?? ''),
                'avatar' => $profile?->avatar ?: null,
                'description' => $profile?->description ?: null,
            ],
            'identity' => [
                'slug' => $identity?->slug ?: null,
            ],
            'balance' => $balance?->toArray(),
            'assignee' => $assignee ? [
                'entity_id' => (int) $assignee->id,
                'slug' => (string) $assignee->slug,
                'type' => (string) $assignee->entityable_type,
                'name' => (string) ($assignee->profile?->name ?: $assignee->slug),
                'avatar' => $assignee->profile?->avatar ?: null,
            ] : null,
            'file_upload' => app(File::class)->uploadAvailability($teamId),
            'create_time' => (int) $customer->create_time,
            'update_time' => (int) $customer->update_time,
        ];
    }

    public function update(int $teamId, int $customerId, array $data): void
    {
        $validator = new \app\validate\CustomerProfile;
        if (!$validator->scene('update')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
        \think\facade\Db::transaction(function () use ($teamId, $customerId, $data): void {
            $customer = app(CustomerAssignment::class)->customer($teamId, $customerId, true);
            if ($customer->is_blocked) {
                throw new HttpException(404, '顾客不存在');
            }
            if (array_key_exists('assignee_entity_id', $data)) {
                $assigneeId = $data['assignee_entity_id'] === null || $data['assignee_entity_id'] === ''
                    ? null
                    : (int) $data['assignee_entity_id'];
                if ($assigneeId) {
                    app(CustomerAssignment::class)->assertEntity($teamId, $assigneeId);
                }
                $customer->assignee_entity_id = $assigneeId;
                $customer->save();
            }
            $entityId = (int) app(Entity::class)
                ->requireBySubject('teamCustomer', (int) $customer->id)->id;
            app(EntityProfile::class)->update($teamId, $entityId, [
                'name' => $data['nickname'],
                'avatar' => $data['avatar'] ?? null,
                'description' => $data['description'] ?? null,
            ]);
        });
    }

    public function assignees(int $teamId): array
    {
        return app(CustomerAssignment::class)->options($teamId);
    }

    public function claimSlug(int $teamId, int $customerId, string $slug): array
    {
        $this->customer($teamId, $customerId);
        $validator = new \app\validate\CustomerProfile;
        if (!$validator->scene('slug')->check(['slug' => $slug])) {
            throw new HttpException(422, $validator->getError());
        }
        $identity = app(Entity::class)->claimCustomer($customerId, $slug);
        return ['slug' => $identity->slug];
    }

    private function customer(int $teamId, int $customerId): TeamCustomer
    {
        $customer = TeamCustomer::where('team_id', $teamId)->find($customerId);
        if (!$customer || $customer->is_blocked) {
            throw new HttpException(404, '顾客不存在');
        }
        return $customer;
    }
}
