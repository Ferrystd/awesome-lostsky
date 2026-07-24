<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamEntityRole;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use think\exception\HttpException;

class Role
{
    public function list(int $teamId): array
    {
        return TeamRole::where('team_id', $teamId)
            ->order('sort', 'asc')
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    public function get(int $teamId, int $id): array
    {
        return $this->find($teamId, $id)->toArray();
    }

    public function create(int $teamId, array $data): int
    {
        $this->validate($data, 'create');

        return TeamRole::transaction(function () use ($teamId, $data) {
            $role = TeamRole::withTrashed()
                ->where('team_id', $teamId)
                ->where('role_key', $data['role_key'])
                ->lock(true)
                ->find();

            if ($role && !$role->trashed()) {
                throw new HttpException(409, '角色标识已存在');
            }

            $values = [
                'team_id'     => $teamId,
                'role_key'    => $data['role_key'],
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'sort'        => (int) ($data['sort'] ?? 0),
            ];

            if ($role) {
                $role->restore();
                $role->save($values);
            } else {
                $role = new TeamRole;
                $role->save($values);
            }

            return (int) $role->id;
        });
    }

    public function update(int $teamId, int $id, array $data): void
    {
        $this->validate(array_merge(['id' => $id], $data), 'update');
        $role = $this->find($teamId, $id);

        $update = [];
        foreach (['name', 'description', 'sort'] as $field) {
            if (array_key_exists($field, $data)) {
                $update[$field] = $field === 'sort' ? (int) $data[$field] : $data[$field];
            }
        }
        if ($update) {
            $role->save($update);
        }
    }

    public function delete(int $teamId, int $id): void
    {
        $this->validate(['id' => $id], 'delete');

        TeamRole::transaction(function () use ($teamId, $id) {
            $role = $this->find($teamId, $id);

            foreach (TeamRolePermission::where('team_id', $teamId)->where('role_id', $id)->select() as $permission) {
                $permission->delete();
            }
            foreach (TeamEntityRole::where('team_id', $teamId)->where('role_id', $id)->select() as $memberRole) {
                $memberRole->delete();
            }
            $role->delete();
        });
    }

    private function find(int $teamId, int $id): TeamRole
    {
        $role = TeamRole::where('team_id', $teamId)->find($id);
        if (!$role) {
            throw new HttpException(404, '角色不存在');
        }

        return $role;
    }

    private function validate(array $data, string $scene): void
    {
        $validator = new \app\validate\Role;
        if (!$validator->scene($scene)->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
