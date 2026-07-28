<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use think\exception\HttpException;

class CustomerProfile
{
    public function get(int $teamId, int $customerId): array
    {
        $customer = $this->customer($teamId, $customerId);
        return TeamCustomer::with(['profile', 'identity'])->find($customer->id)->toArray();
    }

    public function update(int $teamId, int $customerId, array $data): void
    {
        $validator = new \app\validate\CustomerProfile;
        if (!$validator->scene('update')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
        $customer = $this->customer($teamId, $customerId);
        $entityId = (int) app(Entity::class)
            ->requireBySubject('teamCustomer', (int) $customer->id)->id;
        app(EntityProfile::class)->update($teamId, $entityId, [
            'name' => $data['nickname'],
            'avatar' => $data['avatar'] ?? null, 'description' => $data['description'] ?? null,
        ]);
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
            throw new HttpException(404, '客户不存在');
        }
        return $customer;
    }
}
