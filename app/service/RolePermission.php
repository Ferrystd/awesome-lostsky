<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamRole;
use app\model\TeamRolePermission;
use think\exception\HttpException;

class RolePermission
{
    public function list(int $teamId, int $roleId): array
    {
        $this->assertRole($teamId, $roleId);

        return TeamRolePermission::where('team_id', $teamId)
            ->where('role_id', $roleId)
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    public function save(int $teamId, int $roleId, $permissionKeys): void
    {
        if (!is_array($permissionKeys)) {
            throw new HttpException(422, '权限列表格式不正确');
        }
        $data = ['role_id' => $roleId, 'permission_keys' => $permissionKeys];
        $this->validate($data);

        $keys = [];
        foreach ($permissionKeys as $key) {
            if (!is_string($key)) {
                throw new HttpException(422, '权限标识格式不正确');
            }
            if ($key === '' || mb_strlen($key) > 100 || !preg_match('/^[a-z][a-z0-9._-]*$/', $key)) {
                throw new HttpException(422, '权限标识格式不正确');
            }
            $keys[] = $key;
        }
        $keys = array_values(array_unique($keys));

        TeamRolePermission::transaction(function () use ($teamId, $roleId, $keys) {
            $this->assertRole($teamId, $roleId);
            $records = TeamRolePermission::withTrashed()
                ->where('team_id', $teamId)
                ->where('role_id', $roleId)
                ->lock(true)
                ->select();

            $existing = [];
            foreach ($records as $record) {
                $existing[$record->permission_key] = $record;
                if (!in_array($record->permission_key, $keys, true) && !$record->trashed()) {
                    $record->delete();
                }
            }

            foreach ($keys as $key) {
                if (isset($existing[$key])) {
                    if ($existing[$key]->trashed()) {
                        $existing[$key]->restore();
                    }
                    continue;
                }

                $permission = new TeamRolePermission;
                $permission->save([
                    'team_id'        => $teamId,
                    'role_id'        => $roleId,
                    'permission_key' => $key,
                ]);
            }
        });
    }

    private function assertRole(int $teamId, int $roleId): void
    {
        if (!TeamRole::where('team_id', $teamId)->find($roleId)) {
            throw new HttpException(404, '角色不存在');
        }
    }

    private function validate(array $data): void
    {
        $validator = new \app\validate\RolePermission;
        if (!$validator->scene('save')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
