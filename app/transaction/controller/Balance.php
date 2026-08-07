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
        'EntityType:team,teamMember,teamVirtual' => ['except' => []],
        'TeamAuth'           => ['except' => []],
        'Ability:transaction' => ['except' => []],
        'Permission:' . Permissions::TRANSACTION_READ => ['only' => ['logs']],
        'Permission:' . Permissions::TRANSACTION_WRITE => ['only' => ['recharge']],
    ];

    public function logs(Request $request)
    {
        $customerId = $request->get('customer_id/d', 0);

        $service = app(BalanceService::class);
        $result  = $service->logs($request->team_id, $customerId, $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function recharge(Request $request)
    {
        $service = app(BalanceService::class);
        $service->recharge(
            $request->team_id,
            $request->post('customer_id/d', 0),
            $request->post('amount', 0),
            $request->post('memo', '')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'transaction',
            'recharge',
            'customerBalance',
            $request->post('customer_id/d', 0)
        );

        return message('充值成功');
    }
}
