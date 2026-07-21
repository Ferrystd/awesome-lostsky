<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamMember;
use app\model\TeamTransaction;
use app\enum\LogType;
use app\enum\TransactionType;
use think\exception\HttpException;

class Transaction
{
    public function options(int $teamId): array
    {
        $members = TeamMember::where('team_id', $teamId)
            ->with(['profile'])
            ->visible([
                'id',
                'nickname',
                'avatar',
                'is_blocked',
            ])
            ->order('id', 'asc')
            ->select()
            ->toArray();

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

        return compact('members', 'customers');
    }

    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
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
        if (!empty($filters['handler_id'])) {
            $query->where('handler_id', (int) $filters['handler_id']);
        }
        if (!empty($filters['sender_id'])) {
            $query->where('sender_id', (int) $filters['sender_id']);
        }
        if (!empty($filters['cs_id'])) {
            $query->where('cs_id', (int) $filters['cs_id']);
        }
        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }
        if (!empty($filters['keyword'])) {
            $query->whereIn('customer_id', function ($sub) use ($filters) {
                $sub->table('team_customer_profile')
                    ->where('nickname', 'like', "%{$filters['keyword']}%")
                    ->field('customer_id');
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
        $this->validateMath($data);
        $data['type'] = $this->normalizeType($data['type'] ?? TransactionType::LedgerEntry);

        $this->assertMember($teamId, $data['handler_id'] ?? 0, '接单人');
        $this->assertMember($teamId, $data['sender_id'] ?? null, '发单人');
        $this->assertMember($teamId, $data['cs_id'] ?? null, '客服');

        $customerId = $data['customer_id'] ?? null;
        if ($customerId && !TeamCustomer::where('team_id', $teamId)->find($customerId)) {
            throw new HttpException(422, '客户不存在');
        }

        return \think\facade\Db::transaction(function () use ($teamId, $data, $customerId) {
            $prepaid = (float) ($data['prepaid'] ?? 0);
            if ($prepaid > 0 && !$customerId) {
                throw new HttpException(422, '预存款支付必须关联客户');
            }

            if ($prepaid > 0 && $customerId) {
                // FOR UPDATE 行锁，依赖外层 Db::transaction() 才能生效
                $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
                if (!$balance || $balance->balance < $prepaid) {
                    throw new HttpException(422, '客户预存款余额不足');
                }

                TeamCustomerBalance::where('customer_id', $customerId)
                    ->inc('spent', $prepaid)
                    ->dec('balance', $prepaid)
                    ->update();

                $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();

                $transId = $this->saveTransaction($teamId, $data);

                $log = new TeamCustomerBalanceLog;
                $log->customer_id   = $customerId;
                $log->type          = LogType::Consume;
                $log->amount        = -$prepaid;
                $log->balance_after = (float) $balance->balance;
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
        $transaction = TeamTransaction::where('team_id', $teamId)->find($id);
        if (!$transaction) {
            throw new HttpException(404, '流水不存在');
        }

        if ($transaction->enumCase('type') === TransactionType::ShopOrder) {
            throw new HttpException(422, '商城订单流水不可单独编辑，请通过订单操作');
        }

        if (isset($data['handler_id'])) {
            throw new HttpException(422, '不允许修改接单人');
        }

        if (array_key_exists('type', $data)) {
            $data['type'] = $this->normalizeType($data['type']);
        }

        // 合并现有数据做整体校验
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
        foreach (['total_price', 'cash', 'prepaid', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $k) {
            if (array_key_exists($k, $data)) {
                $merged[$k] = $data[$k];
            }
        }
        $this->validateMath($merged);

        $allow = ['type', 'total_price', 'cost', 'cash', 'prepaid',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut',
            'trans_at', 'memo', 'sender_id', 'cs_id', 'customer_id'];

        $update = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $data)) {
                $update[$k] = $data[$k];
            }
        }

        if ($update) {
            $this->assertMember($teamId, $update['sender_id'] ?? null, '发单人');
            $this->assertMember($teamId, $update['cs_id'] ?? null, '客服');

            if (!empty($update['customer_id']) && !TeamCustomer::where('team_id', $teamId)->find($update['customer_id'])) {
                throw new HttpException(422, '客户不存在');
            }

            $oldPrepaid = (float) $transaction->prepaid;
            $newPrepaid = isset($update['prepaid']) ? (float) $update['prepaid'] : $oldPrepaid;
            $oldCustomerId = $transaction->customer_id ? (int) $transaction->customer_id : null;
            $newCustomerId = array_key_exists('customer_id', $update)
                ? ($update['customer_id'] ? (int) $update['customer_id'] : null)
                : $oldCustomerId;

            if ($newPrepaid > 0 && !$newCustomerId) {
                throw new HttpException(422, '预存款支付必须关联客户');
            }

            \think\facade\Db::transaction(function () use (
                $transaction,
                $update,
                $oldCustomerId,
                $newCustomerId,
                $oldPrepaid,
                $newPrepaid
            ) {
                if ($oldCustomerId === $newCustomerId) {
                    $delta = round($newPrepaid - $oldPrepaid, 2);
                    if ($delta > 0) {
                        $this->consumeBalance($oldCustomerId, $delta, (int) $transaction->id, '流水编辑追加消费');
                    } elseif ($delta < 0) {
                        $this->refundBalance($oldCustomerId, -$delta, (int) $transaction->id, '流水编辑退款');
                    }
                } else {
                    if ($oldCustomerId && $oldPrepaid > 0) {
                        $this->refundBalance($oldCustomerId, $oldPrepaid, (int) $transaction->id, '流水更换客户退款');
                    }
                    if ($newCustomerId && $newPrepaid > 0) {
                        $this->consumeBalance($newCustomerId, $newPrepaid, (int) $transaction->id, '流水更换客户消费');
                    }
                }

                $transaction->save($update);
            });
        }
    }

    public function delete(int $teamId, int $id): void
    {
        $transaction = TeamTransaction::where('team_id', $teamId)->find($id);
        if (!$transaction) {
            throw new HttpException(404, '流水不存在');
        }

        if ($transaction->enumCase('type') === TransactionType::ShopOrder) {
            throw new HttpException(422, '商城订单流水不可单独删除，请取消对应订单');
        }

        \think\facade\Db::transaction(function () use ($transaction) {
            // 退还预存款
            if ($transaction->prepaid > 0 && $transaction->customer_id) {
                $balance = TeamCustomerBalance::where('customer_id', $transaction->customer_id)
                    ->lock(true)->find();
                if ($balance) {
                    TeamCustomerBalance::where('customer_id', $transaction->customer_id)
                        ->inc('balance', $transaction->prepaid)
                        ->dec('spent', $transaction->prepaid)
                        ->update();

                    $balance = TeamCustomerBalance::where('customer_id', $transaction->customer_id)->find();

                    $log = new TeamCustomerBalanceLog;
                    $log->customer_id   = $transaction->customer_id;
                    $log->type          = LogType::Refund;
                    $log->amount        = (float) $transaction->prepaid;
                    $log->balance_after = (float) $balance->balance;
                    $log->trans_id      = $transaction->id;
                    $log->memo          = '流水删除退款';
                    $log->save();
                }
            }

            $transaction->delete();
        });
    }

    private function validateMath(array $data): void
    {
        foreach ([
            'total_price',
            'cash',
            'prepaid',
            'cost',
            'handler_cut',
            'sender_cut',
            'cs_cut',
            'team_cut',
        ] as $field) {
            $raw = array_key_exists($field, $data) ? $data[$field] : 0;
            if (!is_int($raw) && !is_float($raw) && !(is_string($raw) && is_numeric($raw))) {
                throw new HttpException(422, '金额必须是大于或等于零的有限数值');
            }

            $value = (float) $raw;
            if (!is_finite($value) || $value < 0) {
                throw new HttpException(422, '金额必须是大于或等于零的有限数值');
            }
        }

        $total   = $data['total_price'] ?? 0;
        $cash    = $data['cash'] ?? 0;
        $prepaid = $data['prepaid'] ?? 0;
        $cost    = $data['cost'] ?? 0;
        $hCut    = $data['handler_cut'] ?? 0;
        $sCut    = $data['sender_cut'] ?? 0;
        $csCut   = $data['cs_cut'] ?? 0;
        $tCut    = $data['team_cut'] ?? 0;

        $totalRounded   = round((float) $total, 2);
        $cashPrepaidSum = round((float) $cash + (float) $prepaid, 2);
        $cutSum         = round((float) $cost + (float) $hCut + (float) $sCut + (float) $csCut + (float) $tCut, 2);

        if ($totalRounded !== $cashPrepaidSum || $totalRounded !== $cutSum) {
            throw new HttpException(422, '总价应等于现款加预存款，且抽成之和应等于总价减成本');
        }
    }

    private function saveTransaction(int $teamId, array $data): int
    {
        $trans = new TeamTransaction;
        $trans->team_id     = $teamId;
        $trans->handler_id  = $data['handler_id'];
        $trans->sender_id   = $data['sender_id'] ?? null;
        $trans->cs_id       = $data['cs_id'] ?? null;
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

    private function assertMember(int $teamId, mixed $memberId, string $role): void
    {
        if ($memberId !== null && (int) $memberId !== 0
            && !TeamMember::where('team_id', $teamId)->find((int) $memberId)) {
            throw new HttpException(422, "{$role}不是本团队成员");
        }
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

    private function consumeBalance(?int $customerId, float $amount, int $transId, string $memo): void
    {
        if (!$customerId || $amount <= 0) {
            return;
        }

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        if (!$balance || (float) $balance->balance < $amount) {
            throw new HttpException(422, '客户预存款余额不足');
        }

        TeamCustomerBalance::where('customer_id', $customerId)
            ->dec('balance', $amount)
            ->inc('spent', $amount)
            ->update();

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();

        $log = new TeamCustomerBalanceLog;
        $log->customer_id   = $customerId;
        $log->type          = LogType::Consume;
        $log->amount        = -$amount;
        $log->balance_after = (float) $balance->balance;
        $log->trans_id      = $transId;
        $log->memo          = $memo;
        $log->save();
    }

    private function refundBalance(?int $customerId, float $amount, int $transId, string $memo): void
    {
        if (!$customerId || $amount <= 0) {
            return;
        }

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        if (!$balance) {
            throw new HttpException(422, '客户余额记录不存在');
        }

        TeamCustomerBalance::where('customer_id', $customerId)
            ->inc('balance', $amount)
            ->dec('spent', $amount)
            ->update();

        $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();

        $log = new TeamCustomerBalanceLog;
        $log->customer_id   = $customerId;
        $log->type          = LogType::Refund;
        $log->amount        = $amount;
        $log->balance_after = (float) $balance->balance;
        $log->trans_id      = $transId;
        $log->memo          = $memo;
        $log->save();
    }
}
