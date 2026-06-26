<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;

class TeamCustomer
{
    public function me(int $teamId, int $customerId): array
    {
        $customer = $this->customer($teamId, $customerId);

        return $customer->toArray();
    }

    public function orders(int $teamId, int $customerId, array $filters, int $page = 1, int $limit = 20): array
    {
        $customer = $this->customer($teamId, $customerId);
        $query    = $customer->orders();

        if (!empty($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }
        if (!empty($filters['start_time'])) {
            $query->where('create_time', '>=', (int) $filters['start_time']);
        }
        if (!empty($filters['end_time'])) {
            $query->where('create_time', '<', (int) $filters['end_time']);
        }

        $total = $query->count();
        $list  = $query->with(['product', 'handler.profile', 'sender.profile', 'transaction'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function transactions(int $teamId, int $customerId, array $filters, int $page = 1, int $limit = 20): array
    {
        $customer = $this->customer($teamId, $customerId);
        $query    = $customer->transactions();

        if (!empty($filters['type'])) {
            $query->where('type', (int) $filters['type']);
        }
        if (!empty($filters['start_time'])) {
            $query->where('trans_at', '>=', (int) $filters['start_time']);
        }
        if (!empty($filters['end_time'])) {
            $query->where('trans_at', '<', (int) $filters['end_time']);
        }

        $total = $query->count();
        $list  = $query->with(['handler.profile', 'sender.profile', 'cs.profile'])
            ->order('trans_at', 'desc')
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function balance(int $teamId, int $customerId): array
    {
        $customer = $this->customer($teamId, $customerId);
        $balance  = $customer->balance;

        if (!$balance) {
            return [
                'balance'   => 0.0,
                'recharged' => 0.0,
                'spent'     => 0.0,
            ];
        }

        return $balance->toArray();
    }

    public function balanceLogs(int $teamId, int $customerId, int $page = 1, int $limit = 20): array
    {
        $customer = $this->customer($teamId, $customerId);
        $query    = $customer->balanceLogs();

        $total = $query->count();
        $list  = $query
            ->with(['transaction'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    private function customer(int $teamId, int $customerId): \app\model\TeamCustomer
    {
        $customer = \app\model\TeamCustomer::inTeam($teamId)
            ->with(['profile', 'balance'])
            ->find($customerId);

        if (!$customer) {
            throw new HttpException(404, '顾客不存在');
        }

        return $customer;
    }
}
