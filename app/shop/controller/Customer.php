<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\TeamCustomer;
use think\Request;

class Customer
{
    protected $middleware = [
        'JwtAuth'        => ['except' => []],
        'Context'        => ['except' => []],
        'CustomerAccess' => ['except' => []],
    ];

    public function me(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->me($request->team_id, $request->customer_id);

        return success($result);
    }

    public function orders(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->orders($request->team_id, $request->customer_id, [
            'status'     => $request->get('status'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function transactions(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->transactions($request->team_id, $request->customer_id, [
            'type'       => $request->get('type'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function balance(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->balance($request->team_id, $request->customer_id);

        return success($result);
    }

    public function balanceLogs(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->balanceLogs(
            $request->team_id,
            $request->customer_id,
            (int) $request->get('page', 1),
            (int) $request->get('limit', 20)
        );

        return success($result);
    }
}
