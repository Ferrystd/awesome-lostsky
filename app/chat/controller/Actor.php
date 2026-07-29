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
            $request->team_id,
            $request->acting_entity
        ));
    }
}
