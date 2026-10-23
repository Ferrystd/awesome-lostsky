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

        if (!empty($filters['personal_entity_id'])) {
            $actorEntityId = (int) $filters['personal_entity_id'];
            $query->where(function ($scope) use ($actorEntityId) {
                $scope->where('handler_entity_id', $actorEntityId)
                    ->whereOr('sender_entity_id', $actorEntityId);
            });
        }

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

        $paginator = $query->order('id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $list  = $paginator->getCollection()->toArray();
        $this->attachRelations($list);

        return app(Pagination::class)->response($paginator, $list);
    }

    public function personal(int $teamId, int $actorEntityId, array $filters, int $page = 1, int $limit = 20): array
    {
        $filters['personal_entity_id'] = $actorEntityId;
        return $this->list($teamId, $filters, $page, $limit);
    }

    public function getPersonal(int $teamId, int $actorEntityId, int $id): array
    {
        $order = TeamOrder::where('team_id', $teamId)
            ->where('id', $id)
            ->where(function ($scope) use ($actorEntityId) {
                $scope->where('handler_entity_id', $actorEntityId)
                    ->whereOr('sender_entity_id', $actorEntityId);
            })
            ->find();
        if (!$order) throw new HttpException(404, '订单不存在');
        $result = $order->toArray();
        $rows = [&$result];
        $this->attachRelations($rows);
        return $result;
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
        app(Validation::class)->check($validator->scene('create'), $data);

        return \think\facade\Db::transaction(function () use ($teamId, $data) {
            $product = TeamProduct::where('team_id', $teamId)
                ->where('id', (int) $data['product_id'])
                ->lock(true)
                ->find();
            if (!$product || !$product->is_active) {
                throw new HttpException(422, '商品不存在或已下架');
            }

            $kind = $product->enumCase('kind') ?? ProductKind::Standard;
            $fulfillmentSnapshot = app(BenefitFulfillment::class)->snapshotProduct($product);
            $purchaseFields = app(ProductPurchaseField::class)->snapshot($product->purchase_fields ?? [], array_key_exists('purchase_values', $data) ? $data['purchase_values'] : []);
            $productHandlers = $data['product_handlers'] ?? [];
            if (!is_array($productHandlers)) throw new HttpException(422, '商品接单人配置格式不正确');
            foreach ($productHandlers as $productId => $entityId) {
                if (!ctype_digit((string) $productId) || (int) $productId < 1 || !is_int($entityId) || $entityId < 1) {
                    throw new HttpException(422, '商品接单人配置格式不正确');
                }
            }
            $usedProductIds = $this->freezeOrdinaryHandlers($teamId, $fulfillmentSnapshot, $data['handler_entity_id'] ?? null, $productHandlers);
            if (array_diff(array_keys($productHandlers), $usedProductIds)) throw new HttpException(422, '接单人配置包含非本次购买的普通商品');
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
            foreach (['sender_entity_id', 'cs_entity_id'] as $field) {
                if (($data[$field] ?? null) !== null) {
                    app(Entity::class)->subject((int) $data[$field]);
                }
            }
            $overrides = [];
            foreach (['handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== null) {
                    if (!empty($fulfillmentSnapshot['pricing_locked'])) {
                        throw new HttpException(422, '嵌套商品不支持下单时修改分成');
                    }
                    $overrides[$field] = $data[$field];
                }
            }
            if (empty($data['sender_entity_id'])) {
                $overrides['sender_cut'] = '0.00';
            }
            if (empty($data['cs_entity_id'])) {
                $overrides['cs_cut'] = '0.00';
            }
            if ($kind !== ProductKind::Standard && !array_key_exists('team_cut', $overrides)) {
                $pricing = app(BenefitPackagePricing::class);
                $price = $pricing->toCents((string) $product->price);
                $cost = $pricing->toCents((string) ($product->cost ?? 0));
                $handlerCut = $pricing->toCents((string) ($product->handler_cut ?? 0));
                $senderCut = $pricing->toCents((string) ($product->sender_cut ?? 0));
                $csCut = $pricing->toCents((string) ($product->cs_cut ?? 0));
                $teamCut = $product->team_cut === null
                    ? $price - $cost - $handlerCut - $senderCut - $csCut
                    : $pricing->toCents((string) $product->team_cut);
                if (empty($data['sender_entity_id'])) $teamCut += $senderCut;
                if (empty($data['cs_entity_id'])) $teamCut += $csCut;
                $overrides['team_cut'] = $pricing->fromCents($teamCut * $quantity);
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
            $transactionRows = $this->compositionTransactions($teamId, $fulfillmentSnapshot, $transData, $quantity, $data['handler_entity_id'] ?? null);
            if ($this->shouldSyncTransaction($teamId)) {
                $transactionIds = [];
                foreach ($transactionRows as $row) $transactionIds[] = app(Transaction::class)->create($teamId, $row);
                $transId = $transactionIds[0] ?? null;
                if (!empty($fulfillmentSnapshot['composition'])) $fulfillmentSnapshot['transaction_ids'] = $transactionIds;
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
            $order->product_name = app(ProductVariant::class)->displayName($product);
            $order->product_cover_image = $product->cover_image ?: null;
            $order->fulfillment_snapshot = $fulfillmentSnapshot;
            $order->purchase_fields = $purchaseFields;
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
                    throw new HttpException(422, '顾客余额记录不存在');
                }
                $balance = (new TeamCustomerBalance)->refund((int) $order->customer_id, $order->prepaid);
                if (!$balance) {
                    throw new HttpException(409, '顾客余额退款失败');
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
            $transactionIds = $order->fulfillment_snapshot['transaction_ids'] ?? [$order->trans_id];
            foreach (array_filter($transactionIds) as $transactionId) {
                $trans = TeamTransaction::where('team_id', $teamId)
                    ->lock(true)
                    ->find($transactionId);
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

    /** 卡密已收款，普通商品兑换只交付和记业绩，不再次扣款或创建核销任务。 */
    public function deliverClaimProduct(\app\model\RedemptionClaim $claim, \app\model\TeamCustomer $customer, array $entry, int $ordinal, ?int $senderId, ?int $csId): int
    {
        return \think\facade\Db::transaction(function () use ($claim, $customer, $entry, $ordinal, $senderId, $csId) {
            \app\model\RedemptionClaim::where('id', $claim->id)->lock(true)->find();
            $existing = TeamOrder::where('source_claim_id', $claim->id)->where('claim_ordinal', $ordinal)->find();
            if ($existing) return (int) $existing->id;
            $teamId = (int) $customer->team_id;
            if ((int) $claim->target_entity_id !== (int) $customer->root_entity_id || (int) $claim->campaign->issuer_team_id !== $teamId) {
                throw new HttpException(403, '兑换交付主体不匹配');
            }
            $product = TeamProduct::withTrashed()->where('team_id', $teamId)->find($entry['product_id']);
            if (!$product) throw new HttpException(422, '兑换商品不存在');
            $handlerId = isset($entry['handler_entity_id'])
                ? (int) app(Entity::class)->subject((int) $entry['handler_entity_id'])['entity']->id
                : $this->resolveHandler($product, null);
            foreach ([$senderId, $csId] as $entityId) {
                if ($entityId !== null) app(Entity::class)->subject($entityId);
            }
            $pricing = app(BenefitPackagePricing::class);
            $money = [];
            foreach ($entry['money'] as $field => $amount) $money[$field] = $pricing->fromCents($pricing->toCents($amount) * $entry['quantity']);
            foreach (['sender_cut' => $senderId, 'cs_cut' => $csId] as $field => $entityId) {
                if (!$entityId) {
                    $money['team_cut'] = $pricing->fromCents($pricing->toCents($money['team_cut']) + $pricing->toCents($money[$field]));
                    $money[$field] = '0.00';
                }
            }
            $data = $money + ['handler_entity_id' => $handlerId, 'sender_entity_id' => $senderId, 'cs_entity_id' => $csId,
                'customer_id' => (int) $customer->id, 'cash' => '0.00', 'prepaid' => '0.00'];
            $transId = $this->shouldSyncTransaction($teamId) ? app(Transaction::class)->create($teamId,
                $data + ['type' => TransactionType::ShopOrder, 'service_credit' => $money['total_price'], 'memo' => '卡密兑换普通商品']) : null;
            $order = new TeamOrder;
            $order->save($data + ['team_id' => $teamId, 'source_claim_id' => (int) $claim->id, 'claim_ordinal' => $ordinal,
                'product_id' => (int) $product->id, 'product_name' => $entry['product_name'] ?? $product->name,
                'product_cover_image' => $entry['product_cover_image'] ?? $product->cover_image,
                'quantity' => $entry['quantity'], 'unit_price' => $entry['money']['total_price'],
                'fulfillment_snapshot' => ['version' => 1, 'kind' => ProductKind::Standard->value],
                'trans_id' => $transId, 'status' => OrderStatus::Completed, 'memo' => '卡密兑换普通商品']);
            return (int) $order->id;
        });
    }

    public function freezeOrdinaryHandlers(int $teamId, array &$snapshot, $handlerEntityId, array $productHandlers = []): array
    {
        $usedProductIds = [];
        foreach ($snapshot['ordinary'] ?? [] as $index => $entry) {
            $product = TeamProduct::where('team_id', $teamId)->lock(true)->find($entry['product_id']);
            if (!$product) throw new HttpException(422, '套餐普通子项不存在');
            $snapshot['ordinary'][$index]['handler_entity_id'] = $this->resolveHandler($product, $productHandlers[$entry['product_id']] ?? $handlerEntityId);
            $usedProductIds[] = (int) $entry['product_id'];
        }
        if (isset($snapshot['target'])) $usedProductIds = array_merge($usedProductIds, $this->freezeOrdinaryHandlers($teamId, $snapshot['target'], $handlerEntityId, $productHandlers));
        foreach ($snapshot['cards'] ?? [] as $index => $card) {
            $usedProductIds = array_merge($usedProductIds, $this->freezeOrdinaryHandlers($teamId, $snapshot['cards'][$index]['target'], $handlerEntityId, $productHandlers));
        }
        return array_values(array_unique($usedProductIds));
    }

    /** 普通子项直接成交，剩余金额只预收；全部流水共享外层下单事务。 */
    private function compositionTransactions(int $teamId, array &$snapshot, array $receipt, int $quantity, $handlerEntityId): array
    {
        if (empty($snapshot['ordinary'])) return [$receipt];
        $pricing = app(BenefitPackagePricing::class);
        $remaining = $pricing->toCents($receipt['total_price']);
        $rows = [];
        foreach ($snapshot['ordinary'] as &$entry) {
            $product = TeamProduct::where('team_id', $teamId)->lock(true)->find($entry['product_id']);
            if (!$product) throw new HttpException(422, '套餐普通子项不存在');
            $entry['handler_entity_id'] ??= $this->resolveHandler($product, $handlerEntityId);
            $row = $receipt;
            $row['type'] = TransactionType::ShopOrder->value;
            $row['handler_entity_id'] = $entry['handler_entity_id'];
            foreach ($entry['money'] as $field => $amount) {
                $row[$field] = $pricing->fromCents($pricing->toCents($amount) * $entry['quantity'] * $quantity);
            }
            foreach (['sender' => 'sender_cut', 'cs' => 'cs_cut'] as $role => $field) {
                if (empty($row[$role . '_entity_id'])) {
                    $row['team_cut'] = $pricing->fromCents($pricing->toCents($row['team_cut']) + $pricing->toCents($row[$field]));
                    $row[$field] = '0.00';
                }
            }
            $row['cash'] = $receipt['customer_id'] === null ? $row['total_price'] : '0.00';
            $row['prepaid'] = $receipt['customer_id'] === null ? '0.00' : $row['total_price'];
            $remaining -= $pricing->toCents($row['total_price']);
            $rows[] = $row;
        }
        unset($entry);
        if ($remaining < 0) throw new HttpException(422, '套餐子项金额超过订单金额');
        if ($remaining > 0 || !empty($snapshot['items'])) {
            $receipt['total_price'] = $pricing->fromCents($remaining);
            $receipt['cash'] = $receipt['customer_id'] === null ? $receipt['total_price'] : '0.00';
            $receipt['prepaid'] = $receipt['customer_id'] === null ? '0.00' : $receipt['total_price'];
            array_unshift($rows, $receipt);
        }
        return $rows;
    }

    private function resolveHandler(TeamProduct $product, $handlerEntityId): int
    {
        $exists = TeamProductHandler::where('product_id', $product->id)->find();

        if (!$exists) {
            return $handlerEntityId === null
                ? (int) app(Entity::class)->requireBySubject('team', (int) $product->team_id)->id
                : (int) app(Entity::class)->subject((int) $handlerEntityId)['entity']->id;
        }

        $handlerEntityId = $handlerEntityId !== null ? (int) $handlerEntityId : null;
        if ($handlerEntityId === null) {
            $ids = TeamProductHandler::where('product_id', $product->id)->column('entity_id');
            if (count($ids) === 1) {
                return (int) app(Entity::class)->subject((int) $ids[0])['entity']->id;
            }

            throw new HttpException(422, '请选择接单人');
        }

        if (!TeamProductHandler::where('product_id', $product->id)
            ->where('entity_id', $handlerEntityId)->find()) {
            throw new HttpException(422, '该接单人不在此商品的可选范围内');
        }

        return (int) app(Entity::class)->subject($handlerEntityId)['entity']->id;
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
            throw new HttpException(422, '预存款支付必须关联顾客');
        }

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        if (!$balance) {
            throw new HttpException(422, '顾客预存款余额不足');
        }

        $balance = (new TeamCustomerBalance)->consume($customerId, $amount);
        if (!$balance) {
            throw new HttpException(422, '顾客预存款余额不足');
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
