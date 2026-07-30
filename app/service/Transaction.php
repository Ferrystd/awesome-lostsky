<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamTransaction;
use app\enum\LogType;
use app\enum\TransactionType;
use think\exception\HttpException;

class Transaction
{
    public function options(int $teamId): array
    {
        // 交易选项接口已由 transaction.read 保护，需要完整主体集合（包括 Customer 与内部隐藏实体）。
        $entities = app(Entity::class)->optionsForTeam($teamId, true);

        $customers = TeamCustomer::where('team_id', $teamId)
            ->with(['profile', 'balance'])
            ->visible([
                'id',
                'nickname',
                'avatar',
                'description',
                'is_blocked',
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

        $total = $query->count();
        $list  = $query->with(['handler.profile', 'sender.profile', 'cs.profile', 'customer.profile'])
            ->order('trans_at', 'desc')
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id): array
    {
        $transaction = TeamTransaction::where('team_id', $teamId)
            ->with(['handler.profile', 'sender.profile', 'cs.profile', 'customer.profile'])
            ->find($id);

        if (!$transaction) {
            throw new HttpException(404, '流水不存在');
        }

        return $transaction->toArray();
    }

    public function create(int $teamId, array $data): int
    {
        $data = array_merge($data, $this->validateMath($data));
        $data['type'] = $this->normalizeType($data['type'] ?? TransactionType::LedgerEntry);

        $this->assertEntity($teamId, $data['handler_entity_id'] ?? 0, '接单人', true);
        $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');
        $this->assertEntity($teamId, $data['cs_entity_id'] ?? null, '客服');

        return \think\facade\Db::transaction(function () use ($teamId, $data) {
            $customerId = empty($data['customer_id']) ? null : (int) $data['customer_id'];
            if ($customerId) {
                $customer = app(CustomerAssignment::class)->customer($teamId, $customerId, true);
                $assignedSenderId = app(CustomerAssignment::class)->sender($customer, $teamId);
                if ($assignedSenderId) {
                    $data['sender_entity_id'] = $assignedSenderId;
                }
            }
            $this->assertEntity($teamId, $data['sender_entity_id'] ?? null, '发单人');

            $prepaid = $data['prepaid'];
            $prepaidChange = (new TeamTransaction)->prepaidChange('0.00', $prepaid);
            if ((int) $prepaidChange['direction'] > 0 && !$customerId) {
                throw new HttpException(422, '预存款支付必须关联客户');
            }

            if ((int) $prepaidChange['direction'] > 0 && $customerId) {
                // FOR UPDATE 行锁，依赖外层 Db::transaction() 才能生效
                $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
                if (!$balance) {
                    throw new HttpException(422, '客户预存款余额不足');
                }

                $balance = (new TeamCustomerBalance)->consume((int) $customerId, $prepaid);
                if (!$balance) {
                    throw new HttpException(422, '客户预存款余额不足');
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

    public function edit(int $teamId, int $id, array $data): void
    {
        if (isset($data['handler_entity_id'])) {
            throw new HttpException(422, '不允许修改接单人');
        }

        if (array_key_exists('type', $data)) {
            $data['type'] = $this->normalizeType($data['type']);
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
            if ($transaction->enumCase('type') === TransactionType::ShopOrder) {
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
                throw new HttpException(422, '预存款支付必须关联客户');
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
                    $this->refundBalance($oldCustomerId, $oldPrepaid, (int) $transaction->id, '流水更换客户退款');
                }
                if ($newCustomerId && (int) $newPrepaidState['direction'] > 0) {
                    $this->consumeBalance($newCustomerId, $newPrepaid, (int) $transaction->id, '流水更换客户消费');
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
            if ($transaction->enumCase('type') === TransactionType::ShopOrder) {
                throw new HttpException(422, '商城订单流水不可单独删除，请取消对应订单');
            }

            // 退还预存款
            $prepaidState = (new TeamTransaction)->prepaidChange('0.00', $transaction->prepaid);
            if ((int) $prepaidState['direction'] > 0 && $transaction->customer_id) {
                $balance = TeamCustomerBalance::where('customer_id', $transaction->customer_id)
                    ->lock(true)->find();
                if (!$balance) {
                    throw new HttpException(422, '客户余额记录不存在');
                }
                $balance = (new TeamCustomerBalance)->refund((int) $transaction->customer_id, $transaction->prepaid);
                if (!$balance) {
                    throw new HttpException(409, '客户余额退款失败');
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
        $trans->handler_entity_id  = $data['handler_entity_id'];
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
        $trans->handler_cut = $data['handler_cut'] ?? 0;
        $trans->sender_cut  = $data['sender_cut'] ?? 0;
        $trans->cs_cut      = $data['cs_cut'] ?? 0;
        $trans->team_cut    = $data['team_cut'] ?? 0;
        $trans->trans_at    = $data['trans_at'] ?? time();
        $trans->memo        = $data['memo'] ?? null;
        $trans->save();

        return (int) $trans->id;
    }

    private function assertEntity(int $teamId, mixed $entityId, string $role, bool $required = false): void
    {
        if ($entityId === null && !$required) {
            return;
        }
        if ((int) $entityId < 1) {
            throw new HttpException(422, "{$role}不能为空");
        }
        app(Entity::class)->assertInTeam((int) $entityId, $teamId);
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
            throw new HttpException(422, '客户余额记录不存在');
        }

        $balance = (new TeamCustomerBalance)->refund($customerId, $amount);
        if (!$balance) {
            throw new HttpException(409, '客户余额退款失败');
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
