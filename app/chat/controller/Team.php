<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Team
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:teamless,team,teamMember,teamCustomer,teamVirtual',
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatTeam::class)->list($request->user_id));
    }
}
