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

    public function catalog(int $teamId): array
    {
        $groups = [
            ['name' => '团队成员', 'items' => $this->items([
                'team.member.read' => '查看成员', 'team.member.invite' => '邀请成员',
                'team.member.update' => '编辑成员', 'team.member.remove' => '移除成员',
                'team.role.read' => '查看角色', 'team.role.write' => '管理角色',
            ])],
            ['name' => '商店', 'items' => $this->items([
                'shop.read' => '查看商店', 'shop.update' => '编辑商店',
                'shop.product.read' => '查看商品', 'shop.product.write' => '编辑商品',
                'shop.product.delete' => '删除商品', 'shop.order.read' => '查看订单',
                'shop.order.write' => '处理订单',
            ])],
            ['name' => '交易与客户', 'items' => $this->items([
                'transaction.read' => '查看交易', 'transaction.write' => '编辑交易',
                'transaction.delete' => '删除交易', 'transaction.category.read' => '查看交易分类',
                'transaction.category.write' => '管理交易分类', 'transaction.report.read' => '查看报表',
                'customer.read' => '查看客户', 'customer.write' => '编辑客户',
                'customer.delete' => '删除客户', 'customer.export' => '导出客户',
            ])],
            ['name' => '文件与设置', 'items' => $this->items([
                'file.read' => '查看文件', 'file.upload' => '上传文件',
                'file.delete' => '删除文件', 'file.share' => '分享文件',
                'team.setting.read' => '查看设置', 'team.setting.update' => '编辑设置',
            ])],
            ['name' => '聊天', 'items' => $this->items([
                'chat.conversation.create' => '创建会话',
                'chat.group.manage' => '管理群聊',
                'chat.temporary.create' => '创建临时会话',
                'chat.message.moderate' => '审核与撤回消息',
                'chat.virtual.create' => '创建虚拟实体',
                'chat.virtual.*.manage' => '管理全部虚拟实体',
                'chat.virtual.*.operate' => '操作全部虚拟实体',
                'chat.virtual.*.field.manage' => '管理全部虚拟实体字段',
                'team.entity_field.member.manage' => '管理成员字段',
                'team.entity_field.customer.manage' => '管理客户字段',
            ])],
        ];

        $virtualItems = [];
        $virtuals = \app\model\TeamVirtual::where('team_id', $teamId)
            ->with(['identity'])
            ->order('name', 'asc')
            ->select();
        foreach ($virtuals as $virtual) {
            $slug = (string) ($virtual->slug ?? '');
            if ($slug === '') {
                continue;
            }
            $label = (string) ($virtual->name ?: $slug);
            foreach (['manage' => '管理', 'operate' => '操作', 'field.manage' => '管理字段'] as $action => $actionLabel) {
                $virtualItems[] = [
                    'key' => "chat.virtual.{$slug}.{$action}",
                    'label' => "{$actionLabel} · {$label}",
                    'resource_slug' => $slug,
                ];
            }
        }
        if ($virtualItems) {
            $groups[] = ['name' => '指定虚拟实体', 'items' => $virtualItems];
        }

        return ['groups' => $groups];
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
            $this->assertChatKey($teamId, $key);
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

    private function assertChatKey(int $teamId, string $key): void
    {
        if (!str_starts_with($key, 'chat.virtual.')) {
            return;
        }
        if ($key === 'chat.virtual.create') {
            return;
        }
        if (!preg_match('/^chat\.virtual\.([a-z0-9][a-z0-9_-]{0,49}|\*)\.(manage|operate|field\.manage)$/', $key, $match)) {
            throw new HttpException(422, '聊天虚拟实体权限格式不正确');
        }
        if ($match[1] === '*') {
            return;
        }

        $identity = \app\model\EntityIdentity::virtual()->where('slug', $match[1])->find();
        $virtual = $identity ? \app\model\TeamVirtual::where('team_id', $teamId)->find($identity->entityable_id) : null;
        if (!$virtual) {
            throw new HttpException(422, '权限对应的虚拟实体不存在');
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

    private function validate(array $data): void
    {
        $validator = new \app\validate\RolePermission;
        if (!$validator->scene('save')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
