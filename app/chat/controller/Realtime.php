<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Realtime
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth', 'ChatAccess',
    ];

    public function connect(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->connectionToken($request->user_id));
    }

    public function subscribe(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->subscriptionToken(
            $request->team_id, $request->user_id,
            $request->acting_entity,
            $request->post('conversation/s', '')
        ));
    }
}
