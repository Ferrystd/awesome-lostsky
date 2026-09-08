<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class RolePermission
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamWorkspaceAuth',
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
        $roleId = $request->post('role_id/d', 0);
        $permissionKeys = $request->post('permission_keys');
        app(\app\service\RolePermission::class)->save(
            $request->team_id,
            $roleId,
            $permissionKeys
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'setPermissions', 'rolePermission', $roleId,
            ['changed_fields' => ['permission_keys'], 'changes' => [['field' => 'permission_keys', 'after' => is_array($permissionKeys) ? array_values($permissionKeys) : []]]]
        );

        return message('角色权限已更新');
    }

    public function catalog(Request $request)
    {
        return success(app(\app\service\RolePermission::class)->catalog($request->team_id));
    }
}
