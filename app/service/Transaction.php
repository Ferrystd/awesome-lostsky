<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamCustomerSender;
use app\model\TeamTransaction;
use app\enum\LogType;
use app\enum\TransactionType;
use think\exception\HttpException;

class Transaction
{
    public function options(int $teamId, ?int $actorEntityId = null): array
    {
        // 交易选项接口已由 transaction.read 保护，需要完整主体集合（包括 Customer 与内部隐藏实体）。
        $entities = app(Entity::class)->optionsForTeam($teamId, true);

        $customerQuery = TeamCustomer::where('team_id', $teamId);
        if ($actorEntityId) {
            $bindingCustomerIds = TeamCustomerSender::where('team_id', $teamId)
                ->where('entity_id', $actorEntityId)
                ->column('customer_id');
            $customerQuery->where(function ($scope) use ($actorEntityId, $bindingCustomerIds) {
                $scope->where('assignee_entity_id', $actorEntityId);
                if ($bindingCustomerIds) $scope->whereIn('id', $bindingCustomerIds, 'OR');
            });
        }

        $customers = $customerQuery
            ->with(['profile', 'balance'])
            ->visible([
                'id',
                'nickname',
                'avatar',
                'description',
                'is_blocked',
                'assignee_entity_id',
                'balance',
            ])
            ->order('id', 'asc')
            ->select()
            ->toArray();

        return compact('entities', 'customers');
    }

    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamTransaction::where('team_id', $teamId);

        if (!empty($filters['personal_entity_id'])) {
            $actorEntityId = (int) $filters['personal_entity_id'];
            $query->where(function ($scope) use ($actorEntityId) {
                $scope->where('handler_entity_id', $actorEntityId)
                    ->whereOr('sender_entity_id', $actorEntityId)
                    ->whereOr('cs_entity_id', $actorEntityId);
            });
        }

        if (!empty($filters['start_time'])) {
            $query->where('trans_at', '>=', (int) $filters['start_time']);
        }
        if (!empty($filters['end_time'])) {
            $query->where('trans_at', '<', (int) $filters['end_time']);
        }
        if (!empty($filters['type'])) {
            $query->where('type', (int) $filters['type']);
        }
        if (!empty($filters['handler_entity_id'])) {
            $query->where('handler_entity_id', (int) $filters['handler_entity_id']);
        }
        if (!empty($filters['sender_entity_id'])) {
            $query->where('sender_entity_id', (int) $filters['sender_entity_id']);
        }
        if (!empty($filters['cs_entity_id'])) {
            $query->where('cs_entity_id', (int) $filters['cs_entity_id']);
        }
        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }
        if (!empty($filters['keyword'])) {
            $query->whereIn('customer_id', function ($sub) use ($filters) {
                $sub->table('team_customer c')
                    ->join('entity e', "e.entityable_type = 'teamCustomer' AND e.entityable_id = c.id")
                    ->join('team_entity_profile p', 'p.entity_id = e.id')
                    ->where('p.name', 'like', "%{$filters['keyword']}%")
                    ->field('c.id');
            });
        }

        $paginator = $query->order('trans_at', 'desc')
            ->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $list  = $paginator->getCollection()->toArray();
        $page  = $paginator->currentPage();
        $limit = $paginator->listRows();
        $this->attachRelations($list);

        return compact('total', 'list', 'page', 'limit');
    }

    public function personal(int $teamId, int $actorEntityId, array $filters, int $page = 1, int $limit = 20): array
    {
        $filters['personal_entity_id'] = $actorEntityId;
        return $this->list($teamId, $filters, $page, $limit);
    }

    public function getPersonal(int $teamId, int $actorEntityId, int $id): array
    {
        $transaction = TeamTransaction::where('team_id', $teamId)
            ->where('id', $id)
            ->where(function ($scope) use ($actorEntityId) {
                $scope->where('handler_entity_id', $actorEntityId)
                    ->whereOr('sender_entity_id', $actorEntityId)
                    ->whereOr('cs_entity_id', $actorEntityId);
            })
            ->find();
        if (!$transaction) throw new HttpException(404, '流水不存在');
        $result = $transaction->toArray();
        $rows = [&$result];
        $this->attachRelations($rows);
        return $result;
    }

    public function get(int $teamId, int $id): array
    {
        $transaction = TeamTransaction::where('team_id', $teamId)->find($id);

        if (!$transaction) {
            throw new HttpException(404, '流水不存在');
        }

        $result = $transaction->toArray();
        $rows = [&$result];
        $this->attachRelations($rows);
        return $result;
    }

    public function create(int $teamId, array $data): int
    {
        return $this->createReceiptOrLedger($teamId, $data, true);
    }

    /** 权益同步收款只采用数据库中冻结的发单人。 */
    public function createEntitlementReceipt(\app\model\TeamServiceEntitlement $entitlement, array $data): int
    {
        $stored = \app\model\TeamServiceEntitlement::find((int) $entitlement->id);
        if (!$stored) throw new HttpException(404, '服务权益不存在');
        $data['type'] = TransactionType::ServicePackageReceipt;
        $data['customer_id'] = (int) $stored->customer_id;
        $data['sender_entity_id'] = $stored->sender_entity_id;
        return $this->createReceiptOrLedger((int) $stored->team_id, $data, false);
    }

    private function createReceiptOrLedger(int $teamId, array $data, bool $useCustomerSender): int
    {
        $data['type'] = $this->normalizeType($data['type'] ?? TransactionType::LedgerEntry);
        if ($data['type'] === TransactionType::UnusedServiceSettlement) throw new HttpException(422, '未使用权益结单只能由系统生成');
        $data = array_merge($data, in_array($data['type'], [
            TransactionType::ServicePackageReceipt,
            TransactionType::ServiceAdjustmentReceipt,
        ], true)
            ? $this->validateReceipt($data)
            : $this->validateMath($data));

        $this->assertEntity(
            $teamId,
            $data['handler_entity_id'] ?? null,
            '接单人',
            !in_array($data['type'], [TransactionType::ServicePackageReceipt, TransactionType::ServiceAdjustmentReceipt], true)
        );
        $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');
        $this->assertEntity($teamId, $data['cs_entity_id'] ?? null, '客服');

        return \think\facade\Db::transaction(function () use ($teamId, $data, $useCustomerSender) {
            $customerId = empty($data['customer_id']) ? null : (int) $data['customer_id'];
            if ($customerId) {
                $customer = app(CustomerAssignment::class)->customer($teamId, $customerId, true);
                $assignedSenderId = app(CustomerAssignment::class)->sender($customer, $teamId);
                if ($useCustomerSender && $assignedSenderId) {
                    $data['sender_entity_id'] = $assignedSenderId;
                }
            }
            $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');

            $prepaid = $data['prepaid'];
            $prepaidChange = (new TeamTransaction)->prepaidChange('0.00', $prepaid);
            if ((int) $prepaidChange['direction'] > 0 && !$customerId) {
                throw new HttpException(422, '预存款支付必须关联顾客');
            }

            if ((int) $prepaidChange['direction'] > 0 && $customerId) {
                // FOR UPDATE 行锁，依赖外层 Db::transaction() 才能生效
                $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
                if (!$balance) {
                    throw new HttpException(422, '顾客预存款余额不足');
                }

                $balance = (new TeamCustomerBalance)->consume((int) $customerId, $prepaid);
                if (!$balance) {
                    throw new HttpException(422, '顾客预存款余额不足');
                }

                $transId = $this->saveTransaction($teamId, $data);

                $log = new TeamCustomerBalanceLog;
                $log->customer_id   = $customerId;
                $log->type          = LogType::Consume;
                $log->amount        = (new TeamCustomerBalance)->negative($prepaid);
                $log->balance_after = $balance->balance;
                $log->trans_id      = $transId;
                $log->memo          = '流水消费';
                $log->save();

                return $transId;
            }

            return $this->saveTransaction($teamId, $data);
        });
    }

    /** 核销流水只表达履约与分成，不再计现金收入。 */
    public function createServiceRedemption(int $teamId, array $data): int
    {
        $data['type'] = TransactionType::ServiceRedemption;
        $data['cash'] = '0.00';
        $data['prepaid'] = '0.00';
        $data['service_credit'] = $data['total_price'] ?? '0.00';
        $data = array_merge($data, $this->validateMath($data));

        $this->assertEntity($teamId, $data['handler_entity_id'] ?? null, '接单人', true);
        $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');
        $this->assertEntity($teamId, $data['cs_entity_id'] ?? null, '客服');

        return $this->saveTransaction($teamId, $data);
    }

    /** 未使用权益结单：无接单人，接单分成归团队，不重复收款。 */
    public function createUnusedServiceSettlement(int $teamId, array $data): int
    {
        $data['type'] = TransactionType::UnusedServiceSettlement;
        $data['handler_entity_id'] = null;
        $data['handler_cut'] = '0.00';
        $data['cash'] = '0.00';
        $data['prepaid'] = '0.00';
        $data['service_credit'] = $data['total_price'] ?? '0.00';
        $data = array_merge($data, $this->validateMath($data));
        $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');
        $this->assertEntity($teamId, $data['cs_entity_id'] ?? null, '客服');
        return $this->saveTransaction($teamId, $data);
    }

    public function createServiceAdjustmentReceipt(int $teamId, array $data): int
    {
        $data['type'] = TransactionType::ServiceAdjustmentReceipt;
        $data['cash'] = '0.00';
        $data['prepaid'] = $data['total_price'] ?? '0.00';
        return $this->create($teamId, $data);
    }

    public function createServiceAdjustmentPerformance(int $teamId, array $data): int
    {
        $data['type'] = TransactionType::ServiceAdjustmentPerformance;
        $data['cash'] = '0.00';
        $data['prepaid'] = '0.00';
        $data['service_credit'] = $data['total_price'] ?? '0.00';
        $data = array_merge($data, $this->validateMath($data));
        $this->assertEntity($teamId, $data['handler_entity_id'] ?? null, '接单人', true);
        $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');
        $this->assertEntity($teamId, $data['cs_entity_id'] ?? null, '客服');
        return $this->saveTransaction($teamId, $data);
    }

    private function attachRelations(array &$rows): void
    {
        $entityIds = [];
        $customerIds = [];
        foreach ($rows as $row) {
            foreach (['handler_entity_id', 'sender_entity_id', 'cs_entity_id'] as $key) {
                $id = (int) ($row[$key] ?? 0);
                if ($id > 0) $entityIds[$id] = $id;
            }
            $customerId = (int) ($row['customer_id'] ?? 0);
            if ($customerId > 0) $customerIds[$customerId] = $customerId;
        }

        $entities = $entityIds
            ? \app\model\Entity::whereIn('id', array_values($entityIds))->with(['profile'])->select()->toArray()
            : [];
        $entityMap = [];
        foreach ($entities as $entity) $entityMap[(int) $entity['id']] = $entity;
        $customers = $customerIds
            ? TeamCustomer::whereIn('id', array_values($customerIds))->with(['profile'])->select()->toArray()
            : [];
        $customerMap = [];
        foreach ($customers as $customer) $customerMap[(int) $customer['id']] = $customer;

        foreach ($rows as &$row) {
            foreach (['handler' => 'handler_entity_id', 'sender' => 'sender_entity_id', 'cs' => 'cs_entity_id'] as $relation => $key) {
                $id = (int) ($row[$key] ?? 0);
                $row[$relation] = $id > 0 ? ($entityMap[$id] ?? null) : null;
            }
            $customerId = (int) ($row['customer_id'] ?? 0);
            $row['customer'] = $customerId > 0 ? ($customerMap[$customerId] ?? null) : null;
        }
    }

    public function edit(int $teamId, int $id, array $data): void
    {
        if (isset($data['handler_entity_id'])) {
            throw new HttpException(422, '不允许修改接单人');
        }

        if (array_key_exists('type', $data)) {
            $data['type'] = $this->normalizeType($data['type']);
            if ($this->isImmutableSourceType($data['type'])) {
                throw new HttpException(422, '普通流水不能改为业务来源流水');
            }
        }

        $allow = ['type', 'total_price', 'cost', 'cash', 'prepaid',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut',
            'trans_at', 'memo', 'sender_entity_id', 'cs_entity_id', 'customer_id'];

        $update = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $data)) {
                $update[$k] = $data[$k];
            }
        }

        if (!$update) {
            return;
        }

        \think\facade\Db::transaction(function () use ($teamId, $id, $update) {
            $transaction = TeamTransaction::where('team_id', $teamId)->lock(true)->find($id);
            if (!$transaction) {
                throw new HttpException(404, '流水不存在');
            }
            if ($this->isImmutableSourceType($transaction->enumCase('type'))) {
                throw new HttpException(422, '商城订单流水不可单独编辑，请通过订单操作');
            }

            $merged = [
                'total_price' => $transaction->total_price,
                'cash'        => $transaction->cash,
                'prepaid'     => $transaction->prepaid,
                'cost'        => $transaction->cost,
                'handler_cut' => $transaction->handler_cut,
                'sender_cut'  => $transaction->sender_cut,
                'cs_cut'      => $transaction->cs_cut,
                'team_cut'    => $transaction->team_cut,
            ];
            foreach (['total_price', 'cash', 'prepaid', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $key) {
                if (array_key_exists($key, $update)) {
                    $merged[$key] = $update[$key];
                }
            }
            $normalized = $this->validateMath($merged);
            foreach ($normalized as $field => $value) {
                if (array_key_exists($field, $update)) {
                    $update[$field] = $value;
                }
                $merged[$field] = $value;
            }

            $this->assertEntity($teamId, $update['cs_entity_id'] ?? null, '客服');

            $oldPrepaid = $transaction->prepaid;
            $newPrepaid = $update['prepaid'] ?? $oldPrepaid;
            $oldCustomerId = $transaction->customer_id ? (int) $transaction->customer_id : null;
            $newCustomerId = array_key_exists('customer_id', $update)
                ? ($update['customer_id'] ? (int) $update['customer_id'] : null)
                : $oldCustomerId;

            $customerChanged = array_key_exists('customer_id', $update)
                && $newCustomerId !== $oldCustomerId;
            $senderSubmitted = array_key_exists('sender_entity_id', $update);
            if ($senderSubmitted) {
                $this->assertEntity($teamId, $update['sender_entity_id'], '发单人');
            }
            if ($newCustomerId && ($customerChanged || $senderSubmitted)) {
                $customer = app(CustomerAssignment::class)->customer($teamId, $newCustomerId, true);
                $assignedSenderId = app(CustomerAssignment::class)->sender($customer, $teamId);
                if ($assignedSenderId) {
                    $update['sender_entity_id'] = $assignedSenderId;
                } elseif ($customerChanged && !$senderSubmitted) {
                    $update['sender_entity_id'] = null;
                }
            } elseif (!$newCustomerId && $customerChanged && !$senderSubmitted) {
                $update['sender_entity_id'] = null;
            }
            $this->assertEntity($teamId, $update['sender_entity_id'] ?? null, '发单人');

            $newPrepaidState = (new TeamTransaction)->prepaidChange('0.00', $newPrepaid);
            if ((int) $newPrepaidState['direction'] > 0 && !$newCustomerId) {
                throw new HttpException(422, '预存款支付必须关联顾客');
            }

            $this->lockCustomerBalances([$oldCustomerId, $newCustomerId]);
            if ($oldCustomerId === $newCustomerId) {
                $change = (new TeamTransaction)->prepaidChange($oldPrepaid, $newPrepaid);
                if ((int) $change['direction'] > 0) {
                    $this->consumeBalance($oldCustomerId, $change['amount'], (int) $transaction->id, '流水编辑追加消费');
                } elseif ((int) $change['direction'] < 0) {
                    $this->refundBalance($oldCustomerId, $change['amount'], (int) $transaction->id, '流水编辑退款');
                }
            } else {
                $oldState = (new TeamTransaction)->prepaidChange('0.00', $oldPrepaid);
                if ($oldCustomerId && (int) $oldState['direction'] > 0) {
                    $this->refundBalance($oldCustomerId, $oldPrepaid, (int) $transaction->id, '流水更换顾客退款');
                }
                if ($newCustomerId && (int) $newPrepaidState['direction'] > 0) {
                    $this->consumeBalance($newCustomerId, $newPrepaid, (int) $transaction->id, '流水更换顾客消费');
                }
            }

            $transaction->save($update);
        });
    }

    public function delete(int $teamId, int $id): void
    {
        \think\facade\Db::transaction(function () use ($teamId, $id) {
            $transaction = TeamTransaction::where('team_id', $teamId)->lock(true)->find($id);
            if (!$transaction) {
                throw new HttpException(404, '流水不存在');
            }
            if ($this->isImmutableSourceType($transaction->enumCase('type'))) {
                throw new HttpException(422, '商城订单流水不可单独删除，请取消对应订单');
            }

            // 退还预存款
            $prepaidState = (new TeamTransaction)->prepaidChange('0.00', $transaction->prepaid);
            if ((int) $prepaidState['direction'] > 0 && $transaction->customer_id) {
                $balance = TeamCustomerBalance::where('customer_id', $transaction->customer_id)
                    ->lock(true)->find();
                if (!$balance) {
                    throw new HttpException(422, '顾客余额记录不存在');
                }
                $balance = (new TeamCustomerBalance)->refund((int) $transaction->customer_id, $transaction->prepaid);
                if (!$balance) {
                    throw new HttpException(409, '顾客余额退款失败');
                }

                $log = new TeamCustomerBalanceLog;
                $log->customer_id   = $transaction->customer_id;
                $log->type          = LogType::Refund;
                $log->amount        = $transaction->prepaid;
                $log->balance_after = $balance->balance;
                $log->trans_id      = $transaction->id;
                $log->memo          = '流水删除退款';
                $log->save();
            }

            $transaction->delete();
        });
    }

    private function validateMath(array $data): array
    {
        try {
            return (new TeamTransaction)->normalizeMoney($data);
        } catch (\InvalidArgumentException $exception) {
            $message = $exception->getMessage() === '金额不平衡'
                ? '总价应等于现款加预存款，且成本与各项抽成之和应等于总价'
                : '金额必须是大于或等于零、最多两位小数的数值';
            throw new HttpException(422, $message);
        }
    }

    private function saveTransaction(int $teamId, array $data): int
    {
        $trans = new TeamTransaction;
        $trans->team_id     = $teamId;
        $trans->handler_entity_id  = $data['handler_entity_id'] ?? null;
        $trans->sender_entity_id   = $data['sender_entity_id'] ?? null;
        $trans->cs_entity_id       = $data['cs_entity_id'] ?? null;
        $trans->customer_id = $data['customer_id'] ?? null;
        $trans->type        = $data['type'] instanceof TransactionType
            ? $data['type']
            : TransactionType::from((int) ($data['type'] ?? TransactionType::LedgerEntry->value));
        $trans->total_price = $data['total_price'] ?? 0;
        $trans->cost        = $data['cost'] ?? 0;
        $trans->cash        = $data['cash'] ?? 0;
        $trans->prepaid     = $data['prepaid'] ?? 0;
        $trans->service_credit = $data['service_credit'] ?? 0;
        $trans->handler_cut = $data['handler_cut'] ?? 0;
        $trans->sender_cut  = $data['sender_cut'] ?? 0;
        $trans->cs_cut      = $data['cs_cut'] ?? 0;
        $trans->team_cut    = $data['team_cut'] ?? 0;
        $trans->service_instance_id = $data['service_instance_id'] ?? null;
        $trans->service_adjustment_id = $data['service_adjustment_id'] ?? null;
        $trans->trans_at    = $data['trans_at'] ?? time();
        $trans->memo        = $data['memo'] ?? null;
        $trans->save();

        return (int) $trans->id;
    }

    private function validateReceipt(array $data): array
    {
        $data['handler_entity_id'] = null;
        $data['service_credit'] = '0.00';
        $data['handler_cut'] = '0.00';
        $data['sender_cut'] = '0.00';
        $data['cs_cut'] = '0.00';
        $data['cost'] = '0.00';
        $data['team_cut'] = $data['total_price'] ?? '0.00';

        return $this->validateMath($data);
    }

    private function isImmutableSourceType(TransactionType $type): bool
    {
        return in_array($type, [
            TransactionType::ShopOrder,
            TransactionType::ServicePackageReceipt,
            TransactionType::ServiceRedemption,
            TransactionType::ServiceAdjustmentReceipt,
            TransactionType::ServiceAdjustmentPerformance,
            TransactionType::UnusedServiceSettlement,
        ], true);
    }

    private function assertEntity(int $teamId, mixed $entityId, string $role, bool $required = false): void
    {
        if ($entityId === null && !$required) {
            return;
        }
        if ((int) $entityId < 1) {
            throw new HttpException(422, "{$role}不能为空");
        }
        app(Entity::class)->subject((int) $entityId);
    }

    private function normalizeType(mixed $type): TransactionType
    {
        if ($type instanceof TransactionType) {
            return $type;
        }

        try {
            return TransactionType::from((int) $type);
        } catch (\ValueError) {
            throw new HttpException(422, '交易类型无效');
        }
    }

    private function lockCustomerBalances(array $customerIds): void
    {
        $ids = array_values(array_unique(array_filter(array_map(
            static fn ($id): int => (int) $id,
            $customerIds
        ))));
        sort($ids, SORT_NUMERIC);
        foreach ($ids as $customerId) {
            TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        }
    }

    private function consumeBalance(?int $customerId, string $amount, int $transId, string $memo): void
    {
        if (!$customerId) {
            return;
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
        $log->trans_id      = $transId;
        $log->memo          = $memo;
        $log->save();
    }

    private function refundBalance(?int $customerId, string $amount, int $transId, string $memo): void
    {
        if (!$customerId) {
            return;
        }

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        if (!$balance) {
            throw new HttpException(422, '顾客余额记录不存在');
        }

        $balance = (new TeamCustomerBalance)->refund($customerId, $amount);
        if (!$balance) {
            throw new HttpException(409, '顾客余额退款失败');
        }

        $log = new TeamCustomerBalanceLog;
        $log->customer_id   = $customerId;
        $log->type          = LogType::Refund;
        $log->amount        = $amount;
        $log->balance_after = $balance->balance;
        $log->trans_id      = $transId;
        $log->memo          = $memo;
        $log->save();
    }
}
