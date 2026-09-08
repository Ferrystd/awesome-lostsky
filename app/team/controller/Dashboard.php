<?php
declare(strict_types=1);

namespace app\team\controller;

use think\Request;

class Dashboard
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual', 'TeamWorkspaceAuth',
    ];

    public function index(Request $request)
    {
        return success(app(\app\service\TeamDashboard::class)->summary(
            $request->team_id,
            $request->acting_entity
        ));
    }
}
