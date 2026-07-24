<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Order as OrderService;
use think\Request;

class Order
{
    protected $middleware = [
        'JwtAuth'           => ['except' => []],
        'Context'           => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamBelongs'       => ['except' => []],
        'MemberAccess'      => ['except' => []],
        'TransactionVerify' => ['only' => ['create']],
        'ShopAccess'        => ['only' => ['cancel', 'complete']],
    ];

    public function index(Request $request)
    {
        $service = app(OrderService::class);
        $result  = $service->list($request->team_id, [
            'customer_id' => $request->get('customer_id'),
            'handler_id'  => $request->get('handler_id'),
            'status'      => $request->get('status'),
            'start_time'  => $request->get('start_time'),
            'end_time'    => $request->get('end_time'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(OrderService::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    public function create(Request $request)
    {
        $service = app(OrderService::class);
        $id = $service->create($request->team_id, [
            'product_id'  => $request->post('product_id'),
            'customer_id' => $request->post('customer_id', null),
            'handler_id'  => $request->post('handler_id', null),
            'sender_id'   => $request->post('sender_id', null),
            'cs_id'       => $request->post('cs_id', null),
            'quantity'    => $request->post('quantity', 1),
            'handler_cut' => $request->post('handler_cut', null),
            'sender_cut'  => $request->post('sender_cut', null),
            'cs_cut'      => $request->post('cs_cut', null),
            'team_cut'    => $request->post('team_cut', null),
            'memo'        => $request->post('memo', null),
        ]);

        return success(['id' => $id], '订单已创建');
    }

    public function cancel(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(OrderService::class);
        $service->cancel($request->team_id, $id);

        return message('订单已取消');
    }

    public function complete(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(OrderService::class);
        $service->complete($request->team_id, $id);

        return message('订单已完成');
    }
}
