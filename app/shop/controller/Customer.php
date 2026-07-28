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
            (int) $request->team_id,
            (int) $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            $request->entity_session ?? null,
            $request->post('slug') === null ? null : (string) $request->post('slug')
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
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function order(Request $request)
    {
        return success(app(TeamCustomer::class)->order(
            (int) $request->team_id,
            (int) $request->customer_id,
            (int) $request->param('id', 0)
        ));
    }

    public function purchase(Request $request)
    {
        $id = app(TeamCustomer::class)->purchase(
            (int) $request->team_id,
            (int) $request->customer_id,
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
        $id = (int) $request->param('id', 0);
        app(TeamCustomer::class)->cancelOrder(
            (int) $request->team_id,
            (int) $request->customer_id,
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
