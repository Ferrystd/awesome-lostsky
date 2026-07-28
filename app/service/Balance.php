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
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
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

    public function recharge(int $teamId, int $customerId, mixed $amount, string $memo = ''): void
    {
        $balanceModel = new TeamCustomerBalance;
        try {
            $amount = $balanceModel->normalizePositiveAmount($amount);
        } catch (\InvalidArgumentException) {
            throw new HttpException(422, '充值金额必须大于零');
        }

        \think\facade\Db::transaction(function () use ($teamId, $customerId, $amount, $memo) {
            if (!TeamCustomer::where('team_id', $teamId)->lock(true)->find($customerId)) {
                throw new HttpException(404, '客户不存在');
            }
            $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
            if (!$balance) {
                $balance = new TeamCustomerBalance;
                $balance->customer_id = $customerId;
                $balance->balance     = 0;
                $balance->recharged   = 0;
                $balance->spent       = 0;
                $balance->save();
            }

            $balance = (new TeamCustomerBalance)->recharge($customerId, $amount);
            if (!$balance) {
                throw new HttpException(409, '客户余额更新失败');
            }

            $log = new TeamCustomerBalanceLog;
            $log->customer_id   = $customerId;
            $log->type          = LogType::Recharge;
            $log->amount        = $amount;
            $log->balance_after = $balance->balance;
            $log->memo          = $memo;
            $log->save();
        });
    }
}
