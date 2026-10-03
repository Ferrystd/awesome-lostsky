<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Actor
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'EntityRequired',
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatActor::class)->current($request->acting_entity));
    }

    public function search(\think\Request $request)
    {
        return success(app(\app\service\ChatActor::class)->search(
            $request->get('q/s', ''), $request->get('slug/s', ''), $request->user_id
        ));
    }
}
