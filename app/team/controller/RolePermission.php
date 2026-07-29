<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class RolePermission
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_ROLE_READ => ['only' => ['index', 'catalog']],
        'Permission:' . Permissions::TEAM_ROLE_WRITE => ['only' => ['save']],
    ];

    public function index(Request $request)
    {
        $roleId = $request->get('role_id/d', 0);

        return success(app(\app\service\RolePermission::class)->list($request->team_id, $roleId));
    }

    public function save(Request $request)
    {
        app(\app\service\RolePermission::class)->save(
            $request->team_id,
            $request->post('role_id/d', 0),
            $request->post('permission_keys')
        );

        return message('角色权限已更新');
    }

    public function catalog(Request $request)
    {
        return success(app(\app\service\RolePermission::class)->catalog($request->team_id));
    }
}
