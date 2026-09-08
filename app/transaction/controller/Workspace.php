<?php
declare(strict_types=1);

namespace app\transaction\controller;

use think\Request;

final class Workspace
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual', 'TeamWorkspaceAuth',
    ];

    public function access(Request $request)
    {
        return success(app(\app\service\TeamAccess::class)->snapshot(
            $request->team_id,
            $request->acting_entity,
            $request
        ));
    }
}
