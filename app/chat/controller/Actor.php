<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Actor
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth', 'ChatAccess',
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatActor::class)->list(
            (int) $request->team_id,
            (array) $request->acting_entity
        ));
    }
}
