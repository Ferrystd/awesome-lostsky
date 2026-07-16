<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamCustomer;
use app\enum\LogType;
use think\exception\HttpException;

class Balance
{
    public function logs(int $teamId, int $customerId, int $page = 1, int $limit = 20): array
    {
        if (!TeamCustomer::where('team_id', $teamId)->find($customerId)) {
            throw new HttpException(404, '客户不存在');
        }

        $total = TeamCustomerBalanceLog::where('customer_id', $customerId)->count();
        $list  = TeamCustomerBalanceLog::where('customer_id', $customerId)
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function recharge(int $teamId, int $customerId, float $amount, string $memo = ''): void
    {
        if ($amount <= 0) {
            throw new HttpException(422, '充值金额必须大于零');
        }

        if (!TeamCustomer::where('team_id', $teamId)->find($customerId)) {
            throw new HttpException(404, '客户不存在');
        }

        \app\model\Base::transaction(function () use ($customerId, $amount, $memo) {
            $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
            if (!$balance) {
                $balance = new TeamCustomerBalance;
                $balance->customer_id = $customerId;
                $balance->balance     = 0;
                $balance->recharged   = 0;
                $balance->spent       = 0;
                $balance->save();
            }

            TeamCustomerBalance::where('customer_id', $customerId)
                ->inc('balance', $amount)
                ->inc('recharged', $amount)
                ->update();

            $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();

            $log = new TeamCustomerBalanceLog;
            $log->customer_id   = $customerId;
            $log->type          = LogType::Recharge->value;
            $log->amount        = $amount;
            $log->balance_after = (float) $balance->balance;
            $log->memo          = $memo;
            $log->save();
        });
    }
}
