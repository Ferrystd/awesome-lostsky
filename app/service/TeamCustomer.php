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

    public function order(int $teamId, int $customerId, int $orderId): array
    {
        $customer = $this->customer($teamId, $customerId);
        $order = $customer->orders()->find($orderId);
        if (!$order) {
            throw new HttpException(404, '订单不存在');
        }

        return $this->orderData($order);
    }

    public function purchase(int $teamId, int $customerId, array $data): int
    {
        $this->customer($teamId, $customerId);

        return app(Order::class)->create($teamId, [
            'product_id' => $data['product_id'] ?? null,
            'customer_id' => $customerId,
            'handler_entity_id' => $data['handler_entity_id'] ?? null,
            'quantity' => $data['quantity'] ?? 1,
            'memo' => $data['memo'] ?? null,
        ]);
    }

    public function cancelOrder(int $teamId, int $customerId, int $orderId): void
    {
        if (!\app\model\TeamOrder::where('team_id', $teamId)
            ->where('customer_id', $customerId)
            ->find($orderId)) {
            throw new HttpException(404, '订单不存在');
        }

        app(Order::class)->cancel($teamId, $orderId);
    }

    public function orders(int $teamId, int $customerId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
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
        $rows = $query->order('id', 'desc')
            ->page($page, $limit)
            ->select();
        $list = array_map(fn ($order): array => $this->orderData($order), $rows->all());

        return compact('total', 'list', 'page', 'limit');
    }

    public function transactions(int $teamId, int $customerId, array $filters, int $page = 1, int $limit = 20): array
    {
        $this->customer($teamId, $customerId);
        return app(Transaction::class)->list($teamId, $filters + ['customer_id' => $customerId], $page, $limit);
    }

    public function balance(int $teamId, int $customerId): array
    {
        $customer = $this->customer($teamId, $customerId);
        $balance  = $customer->balance;

        if (!$balance) {
            return [
                'balance'   => '0.00',
                'recharged' => '0.00',
                'spent'     => '0.00',
            ];
        }

        return $balance->toArray();
    }

    public function balanceLogs(int $teamId, int $customerId, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
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
            ->with(['profile', 'balance', 'identity'])
            ->find($customerId);

        if (!$customer || $customer->is_blocked) {
            throw new HttpException(404, '顾客不存在');
        }

        return $customer;
    }

    private function orderData(\app\model\TeamOrder $order): array
    {
        $handler = $order->handler;

        return [
            'id' => (int) $order->id,
            'product_id' => (int) $order->product_id,
            'product_name' => (string) $order->product_name,
            'product_cover_image' => $order->product_cover_image ?: null,
            'quantity' => (int) $order->quantity,
            'unit_price' => (string) $order->unit_price,
            'total_price' => (string) $order->total_price,
            'prepaid' => (string) $order->prepaid,
            'status' => $order->enumCase('status')?->value ?? (int) $order->status,
            'memo' => $order->memo ?: null,
            'create_time' => (int) $order->create_time,
            'update_time' => (int) $order->update_time,
            'handler' => $handler ? [
                'entity_id' => (int) $handler->id,
                'slug' => (string) $handler->slug,
                'name' => (string) ($handler->profile?->name ?: $handler->slug),
                'avatar' => $handler->profile?->avatar ?: null,
            ] : null,
        ];
    }
}
