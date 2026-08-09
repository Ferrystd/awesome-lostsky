<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity as EntityModel;
use app\model\TeamRole;
use app\model\TeamEntityRole;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
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

    public function catalog(int $teamId): array
    {
        $groups = [];
        foreach (PermissionDictionary::groups() as $name => $items) {
            $groups[] = ['name' => $name, 'items' => $this->items($items)];
        }

        $virtualManagementItems = [];
        $virtualDelegationItems = [];
        $virtualChatItems = [];
        $virtuals = EntityModel::with(['profile'])
            ->where('entityable_type', 'teamVirtual')
            ->whereIn('entityable_id', TeamVirtual::where('team_id', $teamId)->column('id'))
            ->select()
            ->all();
        usort($virtuals, static fn (EntityModel $left, EntityModel $right): int =>
            strcasecmp((string) ($left->profile?->name ?? ''), (string) ($right->profile?->name ?? ''))
        );
        foreach ($virtuals as $virtual) {
            $slug = (string) $virtual->slug;
            if ($slug === '') {
                continue;
            }
            $label = (string) ($virtual->profile?->name ?: $slug);
            foreach (['manage' => '管理', 'field.manage' => '管理字段'] as $action => $actionLabel) {
                $virtualManagementItems[] = [
                    'key' => PermissionDictionary::virtual($slug, $action),
                    'label' => "{$actionLabel} · {$label}",
                    'resource_slug' => $slug,
                ];
            }
            $virtualChatItems[] = [
                'key' => PermissionDictionary::virtual($slug, 'act'),
                'label' => "代表 · {$label} 参与聊天",
                'resource_slug' => $slug,
            ];
            $virtualDelegationItems[] = [
                'key' => PermissionDictionary::assume('virtual', $slug),
                'label' => "领取 · {$label} 身份",
                'resource_slug' => $slug,
            ];
        }
        foreach ($groups as $index => $group) {
            if ($group['name'] === '实体管理') {
                $groups[$index]['items'] = array_merge($group['items'], $virtualManagementItems);
            } elseif ($group['name'] === '实体委托') {
                $groups[$index]['items'] = array_merge($group['items'], $virtualDelegationItems);
            } elseif ($group['name'] === '聊天') {
                $groups[$index]['items'] = array_merge($group['items'], $virtualChatItems);
            }
        }

        return [
            'groups' => $groups,
            'advanced_items' => $this->advancedItems($groups),
        ];
    }

    public function bootstrapOwner(int $teamId, int $memberId): void
    {
        $role = app(TeamRole::class, [], true);
        $role->save([
            'team_id' => $teamId,
            'role_key' => 'owner',
            'name' => '所有者',
            'description' => '团队创建时自动生成的完整管理角色',
            'sort' => 0,
        ]);

        foreach ([
            ['type' => 'teamMember', 'id' => $memberId],
            ['type' => 'team', 'id' => $teamId],
        ] as $entity) {
            $entityId = (int) app(Entity::class)->requireBySubject($entity['type'], $entity['id'])->id;
            $binding = app(TeamEntityRole::class, [], true);
            $binding->save([
                'team_id' => $teamId,
                'entity_id' => $entityId,
                'role_id' => (int) $role->id,
            ]);
        }

        foreach (PermissionDictionary::keys() as $key) {
            $permission = app(TeamRolePermission::class, [], true);
            $permission->save([
                'team_id' => $teamId,
                'role_id' => (int) $role->id,
                'permission_key' => $key,
            ]);
        }
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
            if ($key === '' || mb_strlen($key) > 100
                || !preg_match('/^[a-z][a-z0-9_-]*(?:\.(?:[a-z0-9][a-z0-9_-]*|\*))*$/', $key)
                || substr_count($key, '*') > 1) {
                throw new HttpException(422, '权限标识格式不正确');
            }
            $this->assertDynamicEntityKey($teamId, $key);
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

    private function assertDynamicEntityKey(int $teamId, string $key): void
    {
        if (PermissionDictionary::isFixedKeyOrParent($key)) {
            return;
        }

        $dynamic = PermissionDictionary::dynamic($key) ?? PermissionDictionary::dynamicDescendant($key);
        if (!$dynamic) {
            throw new HttpException(422, '权限不在可用目录中');
        }
        if ($dynamic['kind'] === 'assume') {
            $this->assertAssumeKey($teamId, $dynamic['type'], $dynamic['slug']);
            return;
        }

        $identity = \app\model\Entity::virtual()->where('slug', $dynamic['slug'])->find();
        $virtual = $identity ? \app\model\TeamVirtual::where('team_id', $teamId)->find($identity->entityable_id) : null;
        if (!$virtual) {
            throw new HttpException(422, 'Virtual entity does not belong to this team');
        }
    }

    private function assertAssumeKey(int $teamId, string $type, string $slug): void
    {
        $expectedType = match ($type) {
            'member' => 'teamMember',
            'customer' => 'teamCustomer',
            'virtual' => 'teamVirtual',
        };
        $identity = \app\model\Entity::where('slug', $slug)
            ->where('entityable_type', $expectedType)
            ->find();
        if (!$identity || !$identity->is_valid
            || app(IdentitySession::class)->entityTeamId(
                $expectedType,
                (int) $identity->entityable_id
            ) !== $teamId) {
            throw new HttpException(422, '委托目标不属于当前团队或不可用');
        }
    }

    private function items(array $items): array
    {
        $result = [];
        foreach ($items as $key => $label) {
            $result[] = compact('key', 'label');
        }
        return $result;
    }

    private function advancedItems(array $groups): array
    {
        $covered = [];
        foreach ($groups as $group) {
            foreach ($group['items'] as $item) {
                $key = (string) $item['key'];
                $segments = explode('.', $key);
                array_pop($segments);
                while ($segments) {
                    $parent = implode('.', $segments);
                    $covered[$parent][$key] = true;
                    array_pop($segments);
                }
            }
        }
        ksort($covered);

        $items = [];
        foreach ($covered as $key => $keys) {
            $coveredKeys = array_keys($keys);
            sort($coveredKeys);
            $items[] = [
                'key' => $key,
                'label' => "覆盖 {$key} 下全部权限",
                'covered_keys' => $coveredKeys,
            ];
        }

        return $items;
    }

    private function validate(array $data): void
    {
        $validator = new \app\validate\RolePermission;
        if (!$validator->scene('save')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
