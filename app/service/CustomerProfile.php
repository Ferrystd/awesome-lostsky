<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use app\model\TeamCustomerProfile;
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
        $profile = TeamCustomerProfile::withTrashed()->where('customer_id', $customer->id)->find();
        if (!$profile) {
            $profile = app(TeamCustomerProfile::class, [], true);
        }
        $profile->save([
            'customer_id' => $customer->id, 'nickname' => $data['nickname'],
            'avatar' => $data['avatar'] ?? null, 'description' => $data['description'] ?? null,
            'delete_time' => null,
        ]);
    }

    public function claimSlug(int $teamId, int $customerId, string $slug): array
    {
        $this->customer($teamId, $customerId);
        $validator = new \app\validate\CustomerProfile;
        if (!$validator->scene('slug')->check(['slug' => $slug])) {
            throw new HttpException(422, $validator->getError());
        }
        $identity = app(EntityIdentity::class)->claimCustomer($customerId, $slug);
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
