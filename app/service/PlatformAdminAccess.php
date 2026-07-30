<?php
declare(strict_types=1);

namespace app\service;

use app\model\PlatformAdminRole;
use app\model\PlatformAdminRolePermission;
use app\model\PlatformAdminUserRole;
use app\model\User;
use think\exception\HttpException;
use think\facade\Db;
use think\Request;

final class PlatformAdminAccess
{
    public const SUPER_ADMIN = 'super_admin';

    public function session(int $userId): array
    {
        $roles = $this->rolesForUser($userId);
        $isSuper = $this->containsSuper($roles);

        return [
            'user' => $this->userSummary($userId),
            'roles' => $roles,
            'permissions' => $isSuper ? PermissionDictionary::adminKeys() : $this->permissions($userId),
            'is_super_admin' => $isSuper,
        ];
    }

    public function assertAdmin(int $userId): void
    {
        if ($userId < 1 || !$this->rolesForUser($userId)) {
            throw new HttpException(403, '你没有进入平台管理后台的权限');
        }
    }

    public function has(int $userId, string $permission): bool
    {
        $roles = $this->rolesForUser($userId);
        if ($this->containsSuper($roles)) {
            return true;
        }

        return in_array($permission, $this->permissions($userId), true);
    }

    public function assert(int $userId, string ...$permissions): void
    {
        $this->assertAdmin($userId);
        foreach ($permissions as $permission) {
            if ($this->has($userId, $permission)) {
                return;
            }
        }

        throw new HttpException(403, '当前管理员角色没有执行此操作的权限');
    }

    public function administrators(): array
    {
        $rows = Db::name('platform_admin_user_role')
            ->alias('binding')
            ->join('user user', 'user.id = binding.user_id')
            ->join('platform_admin_role role', 'role.id = binding.role_id')
            ->whereNull('binding.delete_time')
            ->whereNull('role.delete_time')
            ->whereNull('user.delete_time')
            ->field('user.id,user.username,user.email,user.phone,user.is_banned,role.id role_id,role.role_key,role.name role_name,role.is_system')
            ->order('user.id', 'asc')
            ->select()
            ->toArray();

        $users = [];
        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $users[$id] ??= [
                'id' => $id,
                'username' => (string) $row['username'],
                'email_masked' => $this->maskEmail((string) ($row['email'] ?? '')),
                'phone_masked' => $this->maskPhone((string) ($row['phone'] ?? '')),
                'is_banned' => (int) $row['is_banned'],
                'roles' => [],
            ];
            $users[$id]['roles'][] = [
                'id' => (int) $row['role_id'],
                'role_key' => (string) $row['role_key'],
                'name' => (string) $row['role_name'],
                'is_system' => (int) $row['is_system'],
            ];
        }

        return array_values($users);
    }

    public function roles(): array
    {
        $roles = PlatformAdminRole::order('is_system', 'desc')->order('id', 'asc')->select()->toArray();
        foreach ($roles as &$role) {
            $role['permissions'] = $role['role_key'] === self::SUPER_ADMIN
                ? PermissionDictionary::adminKeys()
                : PlatformAdminRolePermission::where('role_id', $role['id'])
                    ->order('id', 'asc')
                    ->column('permission_key');
            $role['administrator_count'] = PlatformAdminUserRole::where('role_id', $role['id'])->count();
        }

        return $roles;
    }

    public function role(int $id): array
    {
        $role = PlatformAdminRole::find($id);
        if (!$role) {
            throw new HttpException(404, '平台角色不存在');
        }
        $data = $role->toArray();
        $data['permissions'] = $data['role_key'] === self::SUPER_ADMIN
            ? PermissionDictionary::adminKeys()
            : PlatformAdminRolePermission::where('role_id', $id)->order('id', 'asc')->column('permission_key');
        $data['administrator_count'] = PlatformAdminUserRole::where('role_id', $id)->count();

        return $data;
    }

    public function createRole(array $data, int $actorUserId, ?Request $request = null): int
    {
        $key = trim((string) ($data['role_key'] ?? ''));
        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $permissionKeys = array_key_exists('permission_keys', $data)
            ? $this->normalizePermissionKeys($data['permission_keys'])
            : null;
        if (!preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $key)) {
            throw new HttpException(422, '角色标识需以字母开头，只能包含小写字母、数字、下划线和连字符');
        }
        if ($key === self::SUPER_ADMIN) {
            throw new HttpException(422, 'super_admin 是系统保留角色');
        }
        if ($name === '' || mb_strlen($name) > 50 || mb_strlen($description) > 255) {
            throw new HttpException(422, '角色名称不能为空且不能超过 50 字，说明不能超过 255 字');
        }

        return Db::transaction(function () use (
            $key,
            $name,
            $description,
            $permissionKeys,
            $actorUserId,
            $request
        ): int {
            $role = PlatformAdminRole::withTrashed()
                ->where('role_key', $key)
                ->lock(true)
                ->find();
            if ($role && !$role->trashed()) {
                throw new HttpException(409, '角色标识已存在');
            }
            if ($role) {
                $role->restore();
                $role->save(['name' => $name, 'description' => $description ?: null]);
            } else {
                $role = new PlatformAdminRole;
                $role->save([
                    'role_key' => $key,
                    'name' => $name,
                    'description' => $description ?: null,
                    'is_system' => 0,
                ]);
            }
            if ($permissionKeys !== null) {
                $this->syncPermissions((int) $role->id, $permissionKeys);
            }
            $context = ['role_key' => $key];
            if ($permissionKeys !== null) {
                $context['permission_keys'] = $permissionKeys;
            }
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                'role.create',
                'platform_admin_role',
                (int) $role->id,
                $context,
                $request
            );

            return (int) $role->id;
        });
    }

    public function updateRole(int $id, array $data, int $actorUserId, ?Request $request = null): void
    {
        $update = [];
        $permissionKeys = array_key_exists('permission_keys', $data)
            ? $this->normalizePermissionKeys($data['permission_keys'])
            : null;
        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            if ($name === '' || mb_strlen($name) > 50) {
                throw new HttpException(422, '角色名称不能为空且不能超过 50 字');
            }
            $update['name'] = $name;
        }
        if (array_key_exists('description', $data)) {
            $description = trim((string) $data['description']);
            if (mb_strlen($description) > 255) {
                throw new HttpException(422, '角色说明不能超过 255 字');
            }
            $update['description'] = $description ?: null;
        }
        if (!$update && $permissionKeys === null) {
            return;
        }
        Db::transaction(function () use ($id, $update, $permissionKeys, $actorUserId, $request): void {
            $role = PlatformAdminRole::where('id', $id)->lock(true)->find();
            if (!$role) {
                throw new HttpException(404, '平台角色不存在');
            }
            if ((int) $role->is_system === 1) {
                throw new HttpException(409, '系统角色不能编辑');
            }
            if ($update) {
                $role->save($update);
            }
            if ($permissionKeys !== null) {
                $this->syncPermissions($id, $permissionKeys);
            }
            $context = ['fields' => array_keys($update)];
            if ($permissionKeys !== null) {
                $context['permission_keys'] = $permissionKeys;
            }
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                'role.update',
                'platform_admin_role',
                $id,
                $context,
                $request
            );
        });
    }

    public function deleteRole(int $id, int $actorUserId, ?Request $request = null): void
    {
        Db::transaction(function () use ($id, $actorUserId, $request): void {
            $role = PlatformAdminRole::where('id', $id)->lock(true)->find();
            if (!$role) {
                throw new HttpException(404, '平台角色不存在');
            }
            if ((int) $role->is_system === 1) {
                throw new HttpException(409, '系统角色不能删除');
            }
            $bindings = PlatformAdminUserRole::where('role_id', $id)->lock(true)->select();
            if ($bindings->count() > 0) {
                throw new HttpException(409, '该角色仍分配给管理员，请先调整管理员角色');
            }
            foreach (PlatformAdminRolePermission::where('role_id', $id)->select() as $permission) {
                $permission->delete();
            }
            $role->delete();
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                'role.delete',
                'platform_admin_role',
                $id,
                ['role_key' => $role->role_key],
                $request
            );
        });
    }

    public function savePermissions(
        int $roleId,
        array $permissionKeys,
        int $actorUserId,
        ?Request $request = null
    ): void
    {
        $keys = $this->normalizePermissionKeys($permissionKeys);

        Db::transaction(function () use ($roleId, $keys, $actorUserId, $request): void {
            $role = PlatformAdminRole::where('id', $roleId)->lock(true)->find();
            if (!$role) {
                throw new HttpException(404, '平台角色不存在');
            }
            if ((int) $role->is_system === 1) {
                throw new HttpException(409, '系统角色权限不能编辑');
            }
            $this->syncPermissions($roleId, $keys);
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                'role.permissions.update',
                'platform_admin_role',
                $roleId,
                ['permission_keys' => $keys],
                $request
            );
        });
    }

    public function assignRoles(
        int $actorUserId,
        int $targetUserId,
        array $roleIds,
        ?Request $request = null
    ): void
    {
        if ($actorUserId === $targetUserId) {
            throw new HttpException(409, '不能修改自己的平台管理员角色');
        }
        $roleIds = array_values(array_unique(array_map('intval', $roleIds)));

        Db::transaction(function () use ($actorUserId, $targetUserId, $roleIds, $request): void {
            PlatformAdminRole::where('role_key', self::SUPER_ADMIN)->lock(true)->find();
            $user = User::where('id', $targetUserId)->lock(true)->find();
            if (!$user) {
                throw new HttpException(404, '用户不存在');
            }
            if ($roleIds) {
                $found = PlatformAdminRole::whereIn('id', $roleIds)->lock(true)->column('id');
                if (count($found) !== count($roleIds)) {
                    throw new HttpException(422, '角色列表包含不存在的角色');
                }
            }
            $existing = PlatformAdminUserRole::withTrashed()
                ->where('user_id', $targetUserId)
                ->lock(true)
                ->select();
            $byRole = [];
            foreach ($existing as $binding) {
                $byRole[(int) $binding->role_id] = $binding;
                if (!in_array((int) $binding->role_id, $roleIds, true) && !$binding->trashed()) {
                    if ($this->isSuperRole((int) $binding->role_id)) {
                        $this->assertAnotherActiveSuperAdmin($targetUserId);
                    }
                    $binding->delete();
                }
            }
            foreach ($roleIds as $roleId) {
                if (isset($byRole[$roleId])) {
                    if ($byRole[$roleId]->trashed()) {
                        $byRole[$roleId]->restore();
                        $byRole[$roleId]->assigned_by_user_id = $actorUserId;
                        $byRole[$roleId]->save();
                    }
                } else {
                    (new PlatformAdminUserRole)->save([
                        'user_id' => $targetUserId,
                        'role_id' => $roleId,
                        'assigned_by_user_id' => $actorUserId,
                    ]);
                }
            }
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                'administrator.roles.update',
                'user',
                $targetUserId,
                ['role_ids' => $roleIds],
                $request
            );
        });
    }

    public function grantByKey(int $userId, string $roleKey): void
    {
        $this->bootstrapSuperRole();
        Db::transaction(function () use ($userId, $roleKey): void {
            $user = User::where('id', $userId)->lock(true)->find();
            $role = PlatformAdminRole::where('role_key', $roleKey)->lock(true)->find();
            if (!$user || !$role) {
                throw new HttpException(404, !$user ? '用户不存在' : '平台角色不存在');
            }
            $binding = PlatformAdminUserRole::withTrashed()
                ->where('user_id', $userId)
                ->where('role_id', $role->id)
                ->lock(true)
                ->find();
            if ($binding && !$binding->trashed()) {
                return;
            }
            if ($binding) {
                $binding->restore();
            } else {
                (new PlatformAdminUserRole)->save([
                    'user_id' => $userId,
                    'role_id' => (int) $role->id,
                    'assigned_by_user_id' => null,
                ]);
            }
            app(BusinessAudit::class)->recordPlatform(
                null,
                'administrator.role.grant',
                'user',
                $userId,
                ['source' => 'cli', 'role_key' => $roleKey]
            );
        });
    }

    public function revokeByKey(int $userId, string $roleKey): void
    {
        Db::transaction(function () use ($userId, $roleKey): void {
            $role = PlatformAdminRole::where('role_key', $roleKey)->lock(true)->find();
            if (!$role) {
                throw new HttpException(404, '平台角色不存在');
            }
            $binding = PlatformAdminUserRole::where('user_id', $userId)
                ->where('role_id', $role->id)
                ->lock(true)
                ->find();
            if (!$binding) {
                return;
            }
            if ($roleKey === self::SUPER_ADMIN) {
                $this->assertAnotherActiveSuperAdmin($userId);
            }
            $binding->delete();
            app(BusinessAudit::class)->recordPlatform(
                null,
                'administrator.role.revoke',
                'user',
                $userId,
                ['source' => 'cli', 'role_key' => $roleKey]
            );
        });
    }

    public function bootstrapSuperRole(): void
    {
        $role = PlatformAdminRole::withTrashed()->where('role_key', self::SUPER_ADMIN)->find();
        if ($role) {
            if ($role->trashed()) {
                $role->restore();
            }
            $role->save(['name' => '超级管理员', 'description' => '拥有全部平台管理权限', 'is_system' => 1]);
            return;
        }
        (new PlatformAdminRole)->save([
            'role_key' => self::SUPER_ADMIN,
            'name' => '超级管理员',
            'description' => '拥有全部平台管理权限',
            'is_system' => 1,
        ]);
    }

    public function assertAnotherActiveSuperAdmin(int $excludedUserId): void
    {
        $role = PlatformAdminRole::where('role_key', self::SUPER_ADMIN)->lock(true)->find();
        if (!$role) {
            throw new HttpException(409, '平台缺少超级管理员系统角色');
        }
        $admins = Db::name('platform_admin_user_role')
            ->alias('binding')
            ->join('platform_admin_role role', 'role.id = binding.role_id')
            ->join('user user', 'user.id = binding.user_id')
            ->where('role.id', (int) $role->id)
            ->where('binding.user_id', '<>', $excludedUserId)
            ->where('user.is_banned', 0)
            ->whereNull('binding.delete_time')
            ->whereNull('role.delete_time')
            ->whereNull('user.delete_time')
            ->field('binding.user_id')
            ->lock(true)
            ->select()
            ->toArray();
        if (count($admins) < 1) {
            throw new HttpException(409, '该操作会导致平台没有可用的超级管理员');
        }
    }

    private function rolesForUser(int $userId): array
    {
        if ($userId < 1) {
            return [];
        }
        return Db::name('platform_admin_user_role')
            ->alias('binding')
            ->join('platform_admin_role role', 'role.id = binding.role_id')
            ->join('user user', 'user.id = binding.user_id')
            ->where('binding.user_id', $userId)
            ->where('user.is_banned', 0)
            ->whereNull('binding.delete_time')
            ->whereNull('role.delete_time')
            ->whereNull('user.delete_time')
            ->field('role.id,role.role_key,role.name,role.description,role.is_system')
            ->order('role.id', 'asc')
            ->select()
            ->toArray();
    }

    private function normalizePermissionKeys(mixed $permissionKeys): array
    {
        if (!is_array($permissionKeys)) {
            throw new HttpException(422, '权限列表格式不正确');
        }
        $keys = array_values(array_unique(array_map('strval', $permissionKeys)));
        foreach ($keys as $key) {
            if (!in_array($key, PermissionDictionary::adminKeys(), true)) {
                throw new HttpException(422, "权限 {$key} 不在平台权限目录中");
            }
        }

        return $keys;
    }

    private function syncPermissions(int $roleId, array $keys): void
    {
        $existing = PlatformAdminRolePermission::withTrashed()
            ->where('role_id', $roleId)
            ->lock(true)
            ->select();
        $byKey = [];
        foreach ($existing as $record) {
            $byKey[(string) $record->permission_key] = $record;
            if (!in_array((string) $record->permission_key, $keys, true) && !$record->trashed()) {
                $record->delete();
            }
        }
        foreach ($keys as $key) {
            if (isset($byKey[$key])) {
                if ($byKey[$key]->trashed()) {
                    $byKey[$key]->restore();
                }
            } else {
                (new PlatformAdminRolePermission)->save([
                    'role_id' => $roleId,
                    'permission_key' => $key,
                ]);
            }
        }
    }

    private function permissions(int $userId): array
    {
        return array_values(array_unique(Db::name('platform_admin_user_role')
            ->alias('binding')
            ->join('platform_admin_role_permission permission', 'permission.role_id = binding.role_id')
            ->join('platform_admin_role role', 'role.id = binding.role_id')
            ->where('binding.user_id', $userId)
            ->whereNull('binding.delete_time')
            ->whereNull('permission.delete_time')
            ->whereNull('role.delete_time')
            ->column('permission.permission_key')));
    }

    private function userSummary(int $userId): array
    {
        $user = User::find($userId);
        if (!$user) {
            throw new HttpException(401, '当前登录用户不存在');
        }
        return [
            'id' => (int) $user->id,
            'username' => (string) $user->username,
            'email_masked' => $this->maskEmail((string) ($user->email ?? '')),
            'phone_masked' => $this->maskPhone((string) ($user->phone ?? '')),
        ];
    }

    private function containsSuper(array $roles): bool
    {
        foreach ($roles as $role) {
            if (($role['role_key'] ?? '') === self::SUPER_ADMIN) {
                return true;
            }
        }
        return false;
    }

    private function isSuperRole(int $roleId): bool
    {
        return PlatformAdminRole::where('id', $roleId)->value('role_key') === self::SUPER_ADMIN;
    }

    private function maskPhone(string $phone): string
    {
        return mb_strlen($phone) >= 7
            ? mb_substr($phone, 0, 3) . '****' . mb_substr($phone, -4)
            : $phone;
    }

    private function maskEmail(string $email): string
    {
        if (!str_contains($email, '@')) {
            return $email;
        }
        [$name, $domain] = explode('@', $email, 2);
        return mb_substr($name, 0, 1) . '***@' . $domain;
    }
}
