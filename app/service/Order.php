<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use app\model\TeamProductHandler;
use app\model\TeamOrder;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamTransaction;
use app\enum\OrderStatus;
use app\enum\TransactionType;
use app\enum\LogType;
use app\enum\ProductKind;
use think\exception\HttpException;

class Order
{
    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamOrder::where('team_id', $teamId);

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }
        if (isset($filters['handler_entity_id'])) {
            $query->where('handler_entity_id', (int) $filters['handler_entity_id']);
        }
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
        $list  = $query->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();
        $this->attachRelations($list);

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id): array
    {
        $order = TeamOrder::where('team_id', $teamId)->find($id);

        if (!$order) {
            throw new HttpException(404, '订单不存在');
        }

        $result = $order->toArray();
        $rows = [&$result];
        $this->attachRelations($rows);
        return $result;
    }

    public function create(int $teamId, array $data): int
    {
        $validator = app(\app\validate\Order::class);
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        return \think\facade\Db::transaction(function () use ($teamId, $data) {
            $product = TeamProduct::where('team_id', $teamId)
                ->where('id', (int) $data['product_id'])
                ->lock(true)
                ->find();
            if (!$product || !$product->is_active) {
                throw new HttpException(422, '商品不存在或已下架');
            }

            $kind = $product->enumCase('kind') ?? ProductKind::Standard;
            $handlerId = $kind === ProductKind::Standard
                ? $this->resolveHandler($product, $data['handler_entity_id'] ?? null)
                : null;
            $quantity  = (int) ($data['quantity'] ?? 1);
            $customerId = empty($data['customer_id']) ? null : (int) $data['customer_id'];
            if ($customerId) {
                $customer = app(CustomerAssignment::class)->customer($teamId, $customerId, true);
                $assignedSenderId = app(CustomerAssignment::class)->sender($customer, $teamId);
                if ($assignedSenderId) {
                    $data['sender_entity_id'] = $assignedSenderId;
                }
            }
            $overrides = [];
            foreach (['handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== null) {
                    $overrides[$field] = $data[$field];
                }
            }
            if (empty($data['sender_entity_id'])) {
                $overrides['sender_cut'] = '0.00';
            }
            if (empty($data['cs_entity_id'])) {
                $overrides['cs_cut'] = '0.00';
            }
            try {
                $quote = (new TeamOrder)->quote($product, $quantity, $overrides, $customerId !== null);
            } catch (\InvalidArgumentException) {
                throw new HttpException(422, '订单金额不合法或不平衡');
            }

            $transData = [
                'handler_entity_id'  => $handlerId,
                'sender_entity_id'   => $data['sender_entity_id'] ?? null,
                'cs_entity_id'       => $data['cs_entity_id'] ?? null,
                'customer_id' => $customerId,
                'type'        => $kind === ProductKind::Standard
                    ? TransactionType::ShopOrder->value
                    : TransactionType::ServicePackageReceipt->value,
                'total_price' => $quote['total_price'],
                'cost'        => $quote['cost'],
                'cash'        => $quote['cash'],
                'prepaid'     => $quote['prepaid'],
                'handler_cut' => $quote['handler_cut'],
                'sender_cut'  => $quote['sender_cut'],
                'cs_cut'      => $quote['cs_cut'],
                'team_cut'    => $quote['team_cut'],
                'trans_at'    => time(),
                'memo'        => $data['memo'] ?? null,
            ];

            $transId = null;
            if ($this->shouldSyncTransaction($teamId)) {
                $transId = app(Transaction::class)->create($teamId, $transData);
            } else {
                $this->consumePrepaid($customerId, $quote['prepaid']);
            }

            $order = new TeamOrder;
            $order->team_id     = $teamId;
            $order->customer_id = $customerId;
            $order->handler_entity_id  = $handlerId;
            $order->sender_entity_id   = $data['sender_entity_id'] ?? null;
            $order->cs_entity_id       = $data['cs_entity_id'] ?? null;
            $order->product_id  = (int) $data['product_id'];
            $order->product_name = (string) $product->name;
            $order->product_cover_image = $product->cover_image ?: null;
            $order->quantity    = $quantity;
            $order->unit_price  = $quote['unit_price'];
            $order->total_price = $quote['total_price'];
            $order->cost        = $quote['cost'];
            $order->handler_cut = $quote['handler_cut'];
            $order->sender_cut  = $quote['sender_cut'];
            $order->cs_cut      = $quote['cs_cut'];
            $order->team_cut    = $quote['team_cut'];
            $order->cash        = $quote['cash'];
            $order->prepaid     = $quote['prepaid'];
            $order->trans_id    = $transId;
            $order->status      = OrderStatus::Processing;
            $order->memo        = $data['memo'] ?? null;
            $order->save();

            return (int) $order->id;
        });
    }

    public function cancel(int $teamId, int $id): void
    {
        \think\facade\Db::transaction(function () use ($teamId, $id) {
            $order = TeamOrder::where('team_id', $teamId)->lock(true)->find($id);
            if (!$order) {
                throw new HttpException(404, '订单不存在');
            }
            if ($order->enumCase('status') === OrderStatus::Cancelled) {
                return;
            }
            if ($order->enumCase('status') !== OrderStatus::Processing) {
                throw new HttpException(422, '仅处理中的订单可取消');
            }

            // 退还预存款
            $prepaidChange = (new TeamTransaction)->prepaidChange('0.00', $order->prepaid);
            if ((int) $prepaidChange['direction'] > 0 && $order->customer_id) {
                $balance = TeamCustomerBalance::where('customer_id', $order->customer_id)
                    ->lock(true)->find();
                if (!$balance) {
                    throw new HttpException(422, '客户余额记录不存在');
                }
                $balance = (new TeamCustomerBalance)->refund((int) $order->customer_id, $order->prepaid);
                if (!$balance) {
                    throw new HttpException(409, '客户余额退款失败');
                }

                $log = new TeamCustomerBalanceLog;
                $log->customer_id   = $order->customer_id;
                $log->type          = LogType::Refund;
                $log->amount        = $order->prepaid;
                $log->balance_after = $balance->balance;
                $log->trans_id      = $order->trans_id;
                $log->memo          = '订单取消退款';
                $log->save();
            }

            // 软删除关联流水
            if ($order->trans_id) {
                $trans = TeamTransaction::where('team_id', $teamId)
                    ->lock(true)
                    ->find($order->trans_id);
                if ($trans) {
                    $trans->delete();
                }
            }

            $order->status = OrderStatus::Cancelled;
            $order->save();
        });
    }

    public function complete(int $teamId, int $id): void
    {
        \think\facade\Db::transaction(function () use ($teamId, $id) {
            $order = TeamOrder::where('team_id', $teamId)->lock(true)->find($id);
            if (!$order) {
                throw new HttpException(404, '订单不存在');
            }
            if ($order->enumCase('status') !== OrderStatus::Processing) {
                throw new HttpException(422, '仅处理中的订单可标记完成');
            }

            app(BenefitFulfillment::class)->fulfillOrder($order);
            $order->status = OrderStatus::Completed;
            $order->save();
        });
    }

    private function resolveHandler(TeamProduct $product, $handlerEntityId): int
    {
        $exists = TeamProductHandler::where('product_id', $product->id)->find();

        if (!$exists) {
            return $handlerEntityId === null
                ? (int) app(Entity::class)->requireBySubject('team', (int) $product->team_id)->id
                : (int) app(Entity::class)->assertInTeam((int) $handlerEntityId, (int) $product->team_id)->id;
        }

        $handlerEntityId = $handlerEntityId !== null ? (int) $handlerEntityId : null;
        if ($handlerEntityId === null) {
            $ids = TeamProductHandler::where('product_id', $product->id)->column('entity_id');
            if (count($ids) === 1) {
                return (int) $ids[0];
            }

            throw new HttpException(422, '请选择接单人');
        }

        if (!TeamProductHandler::where('product_id', $product->id)
            ->where('entity_id', $handlerEntityId)->find()) {
            throw new HttpException(422, '该接单人不在此商品的可选范围内');
        }

        return $handlerEntityId;
    }

    private function attachRelations(array &$rows): void
    {
        $entityIds = [];
        $customerIds = [];
        $productIds = [];
        $transactionIds = [];
        foreach ($rows as $row) {
            foreach (['handler_entity_id', 'sender_entity_id', 'cs_entity_id'] as $key) {
                $id = (int) ($row[$key] ?? 0);
                if ($id > 0) $entityIds[$id] = $id;
            }
            $customerId = (int) ($row['customer_id'] ?? 0);
            if ($customerId > 0) $customerIds[$customerId] = $customerId;
            $productId = (int) ($row['product_id'] ?? 0);
            if ($productId > 0) $productIds[$productId] = $productId;
            $transactionId = (int) ($row['trans_id'] ?? 0);
            if ($transactionId > 0) $transactionIds[$transactionId] = $transactionId;
        }

        $entityMap = $this->mapById($entityIds
            ? \app\model\Entity::whereIn('id', array_values($entityIds))->with(['profile'])->select()->toArray()
            : []);
        $customerMap = $this->mapById($customerIds
            ? \app\model\TeamCustomer::whereIn('id', array_values($customerIds))->with(['profile'])->select()->toArray()
            : []);
        $productMap = $this->mapById($productIds
            ? TeamProduct::whereIn('id', array_values($productIds))->select()->toArray()
            : []);
        $transactionMap = $this->mapById($transactionIds
            ? TeamTransaction::whereIn('id', array_values($transactionIds))->select()->toArray()
            : []);

        foreach ($rows as &$row) {
            foreach (['handler' => 'handler_entity_id', 'sender' => 'sender_entity_id', 'cs' => 'cs_entity_id'] as $relation => $key) {
                $id = (int) ($row[$key] ?? 0);
                $row[$relation] = $id > 0 ? ($entityMap[$id] ?? null) : null;
            }
            foreach ([
                'customer' => ['customer_id', $customerMap],
                'product' => ['product_id', $productMap],
                'transaction' => ['trans_id', $transactionMap],
            ] as $relation => [$key, $map]) {
                $id = (int) ($row[$key] ?? 0);
                $row[$relation] = $id > 0 ? ($map[$id] ?? null) : null;
            }
        }
    }

    private function mapById(array $rows): array
    {
        $map = [];
        foreach ($rows as $row) $map[(int) $row['id']] = $row;
        return $map;
    }

    private function shouldSyncTransaction(int $teamId): bool
    {
        $settings = app(TeamSetting::class)->internal($teamId, 'shop');
        if ((string) ($settings['sync_transaction'] ?? '1') !== '1') {
            return false;
        }

        return app(AbilityResolver::class)->available($teamId, 'transaction');
    }

    private function consumePrepaid(?int $customerId, string $amount): void
    {
        $change = (new TeamTransaction)->prepaidChange('0.00', $amount);
        if ((int) $change['direction'] <= 0) {
            return;
        }
        if (!$customerId) {
            throw new HttpException(422, '预存款支付必须关联客户');
        }

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        if (!$balance) {
            throw new HttpException(422, '客户预存款余额不足');
        }

        $balance = (new TeamCustomerBalance)->consume($customerId, $amount);
        if (!$balance) {
            throw new HttpException(422, '客户预存款余额不足');
        }

        $log = new TeamCustomerBalanceLog;
        $log->customer_id   = $customerId;
        $log->type          = LogType::Consume;
        $log->amount        = (new TeamCustomerBalance)->negative($amount);
        $log->balance_after = $balance->balance;
        $log->trans_id      = null;
        $log->memo          = '订单消费';
        $log->save();
    }
}
