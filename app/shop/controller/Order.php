<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Order as OrderService;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Order
{
    protected $middleware = [
        'JwtAuth'           => ['except' => []],
        'Context'           => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamWorkspaceAuth' => ['except' => []],
        'Permission:' . Permissions::SHOP_ORDER_READ => ['only' => ['index', 'get']],
        'Permission:' . Permissions::SHOP_ORDER_WRITE => ['only' => ['create', 'cancel', 'complete']],
        'TransactionVerify' => ['only' => ['create']],
    ];

    public function index(Request $request)
    {
        $service = app(OrderService::class);
        $result  = $service->list($request->team_id, [
            'customer_id' => $request->get('customer_id'),
            'handler_entity_id'  => $request->get('handler_entity_id'),
            'status'      => $request->get('status'),
            'start_time'  => $request->get('start_time'),
            'end_time'    => $request->get('end_time'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = $request->route('id/d', 0);

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
            'handler_entity_id'  => $request->post('handler_entity_id', null),
            'product_handlers'   => $request->post('product_handlers', []),
            'sender_entity_id'   => $request->post('sender_entity_id', null),
            'cs_entity_id'       => $request->post('cs_entity_id', null),
            'quantity'    => $request->post('quantity', 1),
            'handler_cut' => $request->post('handler_cut', null),
            'sender_cut'  => $request->post('sender_cut', null),
            'cs_cut'      => $request->post('cs_cut', null),
            'team_cut'    => $request->post('team_cut', null),
            'memo'        => $request->post('memo', null),
        ]);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'create', 'order', $id);

        return success(['id' => $id], '订单已创建');
    }

    public function cancel(Request $request)
    {
        $id = $request->route('id/d', 0);

        $service = app(OrderService::class);
        $service->cancel($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'cancel', 'order', $id);

        return message('订单已取消');
    }

    public function complete(Request $request)
    {
        $id = $request->route('id/d', 0);

        $service = app(OrderService::class);
        $service->complete($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'complete', 'order', $id);

        return message('订单已完成');
    }
}
