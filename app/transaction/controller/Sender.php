<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\Sender as SenderService;
use think\Request;

class Sender
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamBelongs'  => ['except' => []],
        'MemberAccess' => ['except' => []],
        'TeamAccess'   => ['only' => ['all', 'bind', 'unbind']],
    ];

    public function index(Request $request)
    {
        $service = app(SenderService::class);
        $result  = $service->bindings($request->team_id, $request->member_id);

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
            (int) $request->post('member_id', 0),
            (int) $request->post('customer_id', 0)
        );

        return message('绑定成功');
    }

    public function unbind(Request $request)
    {
        $service = app(SenderService::class);
        $service->unbind($request->team_id, (int) $request->post('id', 0));

        return message('已解绑');
    }
}
