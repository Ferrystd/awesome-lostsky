<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\PermissionDictionary as Permissions;
use think\exception\HttpException;
use think\Request;

final class Access
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_ACCESS_READ => ['only' => ['administrators', 'permissions', 'roles', 'role']],
        'AdminPermission:' . Permissions::ADMIN_ACCESS_WRITE => ['only' => ['assignRoles', 'createRole', 'updateRole', 'deleteRole', 'savePermissions']],
    ];

    public function administrators()
    {
        return success(app(\app\service\PlatformAdminAccess::class)->administrators());
    }

    public function assignRoles(Request $request)
    {
        $roleIds = $request->post('role_ids');
        if (!is_array($roleIds)) {
            throw new HttpException(422, '角色列表格式不正确');
        }
        app(\app\service\PlatformAdminAccess::class)->assignRoles(
            $request->user_id,
            $request->route('user_id/d'),
            $roleIds,
            $request
        );
        return message('管理员角色已更新');
    }

    public function permissions()
    {
        $groups = [];
        foreach (Permissions::adminGroups() as $name => $items) {
            $groups[] = [
                'name' => $name,
                'items' => array_map(
                    static fn (string $label, string $key): array => compact('key', 'label'),
                    $items,
                    array_keys($items)
                ),
            ];
        }
        return success(['groups' => $groups]);
    }

    public function roles()
    {
        return success(app(\app\service\PlatformAdminAccess::class)->roles());
    }

    public function role(Request $request)
    {
        return success(app(\app\service\PlatformAdminAccess::class)->role($request->route('id/d')));
    }

    public function createRole(Request $request)
    {
        $data = [
            'role_key' => $request->post('role_key/s', ''),
            'name' => $request->post('name/s', ''),
            'description' => $request->post('description/s', ''),
        ];
        $permissionKeys = $request->post('permission_keys');
        if ($permissionKeys !== null) {
            if (!is_array($permissionKeys)) {
                throw new HttpException(422, '权限列表格式不正确');
            }
            $data['permission_keys'] = $permissionKeys;
        }
        $id = app(\app\service\PlatformAdminAccess::class)->createRole(
            $data,
            $request->user_id,
            $request
        );
        return success(['id' => $id], '平台角色已创建');
    }

    public function updateRole(Request $request)
    {
        $data = [];
        foreach (['name', 'description'] as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->post("{$field}/s", '');
            }
        }
        $permissionKeys = $request->post('permission_keys');
        if ($permissionKeys !== null) {
            if (!is_array($permissionKeys)) {
                throw new HttpException(422, '权限列表格式不正确');
            }
            $data['permission_keys'] = $permissionKeys;
        }
        app(\app\service\PlatformAdminAccess::class)->updateRole(
            $request->route('id/d'),
            $data,
            $request->user_id,
            $request
        );
        return message('平台角色已更新');
    }

    public function deleteRole(Request $request)
    {
        app(\app\service\PlatformAdminAccess::class)->deleteRole(
            $request->route('id/d'),
            $request->user_id,
            $request
        );
        return message('平台角色已删除');
    }

    public function savePermissions(Request $request)
    {
        $keys = $request->post('permission_keys');
        if (!is_array($keys)) {
            throw new HttpException(422, '权限列表格式不正确');
        }
        app(\app\service\PlatformAdminAccess::class)->savePermissions(
            $request->route('id/d'),
            $keys,
            $request->user_id,
            $request
        );
        return message('角色权限已更新');
    }
}
