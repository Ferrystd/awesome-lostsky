<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Order;
use app\service\PermissionDictionary as Permissions;
use think\Request;

final class Personal
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::SHOP_ORDER_READ,
    ];

    public function orders(Request $request)
    {
        return success(app(Order::class)->personal(
            $request->team_id,
            $request->entity_id,
            [
                'status' => $request->get('status'),
                'start_time' => $request->get('start_time'),
                'end_time' => $request->get('end_time'),
            ],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function order(Request $request)
    {
        return success(app(Order::class)->getPersonal(
            $request->team_id,
            $request->entity_id,
            $request->route('id/d', 0)
        ));
    }
}
