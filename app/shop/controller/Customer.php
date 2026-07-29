<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\TeamCustomer;
use app\service\CustomerBinding;
use think\Request;

class Customer
{
    protected $middleware = [
        'JwtAuth'        => ['except' => []],
        'Context'        => ['except' => []],
        'EntityType:teamless,team,teamMember,teamCustomer,teamVirtual' => ['only' => ['bind']],
        'EntityType:teamCustomer' => ['except' => ['bind']],
        'TeamAuth'       => ['except' => ['bind']],
        'CustomerAccess' => ['except' => ['bind']],
    ];

    public function bind(Request $request)
    {
        $result = app(CustomerBinding::class)->bind(
            $request->team_id,
            $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            $request->entity_session ?? null,
            $request->post('slug') === null ? null : $request->post('slug/s')
        );

        return success($result, $result['created'] ? '客户身份已建立' : '客户身份已领取');
    }

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
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function order(Request $request)
    {
        return success(app(TeamCustomer::class)->order(
            $request->team_id,
            $request->customer_id,
            $request->route('id/d', 0)
        ));
    }

    public function purchase(Request $request)
    {
        $id = app(TeamCustomer::class)->purchase(
            $request->team_id,
            $request->customer_id,
            [
                'product_id' => $request->post('product_id'),
                'quantity' => $request->post('quantity', 1),
                'handler_entity_id' => $request->post('handler_entity_id', null),
                'memo' => $request->post('memo', null),
            ]
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'purchase', 'order', $id);

        return success(['id' => $id], '购买成功');
    }

    public function cancelOrder(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(TeamCustomer::class)->cancelOrder(
            $request->team_id,
            $request->customer_id,
            $id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'cancel', 'order', $id);

        return message('订单已取消，余额已退回');
    }

    public function transactions(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->transactions($request->team_id, $request->customer_id, [
            'type'       => $request->get('type'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

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
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        );

        return success($result);
    }
}
