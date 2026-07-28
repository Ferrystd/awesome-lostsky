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
        return success(app(\app\service\ChatRealtime::class)->connectionToken((int) $request->user_id));
    }

    public function subscribe(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->subscriptionToken(
            (int) $request->team_id, (int) $request->user_id,
            (array) $request->acting_entity,
            (string) $request->post('conversation', '')
        ));
    }
}
