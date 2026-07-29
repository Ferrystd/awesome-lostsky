<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\Sender as SenderService;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Sender
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamAuth'     => ['except' => []],
        'Permission:' . Permissions::TRANSACTION_READ => ['only' => ['index', 'all']],
        'Permission:' . Permissions::TRANSACTION_WRITE => ['only' => ['bind', 'unbind']],
    ];

    public function index(Request $request)
    {
        $service = app(SenderService::class);
        $result  = $service->bindings($request->team_id, $request->entity_id);

        return success($result);
    }

    public function all(Request $request)
    {
        $service = app(SenderService::class);
        $result  = $service->allBindings($request->team_id);

        return success($result);
    }

    public function bind(Request $request)
    {
        $service = app(SenderService::class);
        $service->bind(
            $request->team_id,
            $request->post('entity_id/d', 0),
            $request->post('customer_id/d', 0)
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'transaction',
            'bind',
            'customerSender',
            null,
            ['customer_id' => $request->post('customer_id/d', 0)]
        );

        return message('绑定成功');
    }

    public function unbind(Request $request)
    {
        $service = app(SenderService::class);
        $id = $request->post('id/d', 0);
        $service->unbind($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'unbind', 'customerSender', $id);

        return message('已解绑');
    }
}
