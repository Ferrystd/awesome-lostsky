<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Realtime
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'EntityRequired',
    ];

    public function connect(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->connectionToken(
            (int) $request->entity_session->id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0)
        ));
    }

    public function subscribe(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->subscriptionToken(
            (int) $request->entity_session->id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->post('conversation/s', '')
        ));
    }
}
