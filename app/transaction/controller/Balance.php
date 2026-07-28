<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\Balance as BalanceService;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Balance
{
    protected $middleware = [
        'JwtAuth'            => ['except' => []],
        'Context'            => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamAuth'           => ['except' => []],
        'Ability:transaction' => ['only' => ['recharge']],
        'Permission:' . Permissions::TRANSACTION_READ => ['only' => ['logs']],
        'Permission:' . Permissions::TRANSACTION_WRITE => ['only' => ['recharge']],
    ];

    public function logs(Request $request)
    {
        $customerId = (int) $request->get('customer_id', 0);

        $service = app(BalanceService::class);
        $result  = $service->logs($request->team_id, $customerId, (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function recharge(Request $request)
    {
        $service = app(BalanceService::class);
        $service->recharge(
            $request->team_id,
            (int) $request->post('customer_id', 0),
            $request->post('amount', 0),
            $request->post('memo', '')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'transaction',
            'recharge',
            'customerBalance',
            (int) $request->post('customer_id', 0)
        );

        return message('充值成功');
    }
}
