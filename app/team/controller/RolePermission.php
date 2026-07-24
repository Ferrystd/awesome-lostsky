<?php
declare(strict_types=1);

namespace app\team\controller;

use think\Request;

class RolePermission
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamBelongs', 'TeamAccess',
    ];

    public function index(Request $request)
    {
        $roleId = (int) $request->param('role_id', 0);

        return success(app(\app\service\RolePermission::class)->list($request->team_id, $roleId));
    }

    public function save(Request $request)
    {
        app(\app\service\RolePermission::class)->save(
            $request->team_id,
            (int) $request->post('role_id', 0),
            $request->post('permission_keys')
        );

        return message('角色权限已更新');
    }

    public function catalog(Request $request)
    {
        return success(app(\app\service\RolePermission::class)->catalog((int) $request->team_id));
    }
}
