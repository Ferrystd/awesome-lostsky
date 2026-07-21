<?php
declare(strict_types=1);

namespace app\service;

use app\model\EntityIdentity;
use app\model\TeamEntityFieldValue;
use app\model\TeamRolePermission;
use app\model\TeamVirtual as TeamVirtualModel;
use app\model\TeamVirtualIntegration;
use think\exception\HttpException;

class ChatVirtual
{
    public function list(int $teamId, int $memberId, string $mode = 'manage'): array
    {
        $mode = $mode === 'operate' ? 'operate' : 'manage';
        $gate = app(PermissionGate::class);
        $items = TeamVirtualModel::where('team_id', $teamId)
            ->with(['identity', 'integrations'])
            ->order('name', 'asc')
            ->select()
            ->filter(fn ($virtual) => $virtual->slug && $gate->allows($teamId, $memberId, [
                "chat.virtual.*.{$mode}",
                "chat.virtual.{$virtual->slug}.{$mode}",
            ]))
            ->toArray();
        return array_values($items);
    }

    public function get(int $teamId, string $slug): array
    {
        $virtual = $this->virtual($teamId, $slug);
        return TeamVirtualModel::with(['identity', 'integrations'])->find($virtual->id)->toArray();
    }

    public function create(int $teamId, array $data): array
    {
        $this->validate('create', $data);

        return \think\facade\Db::transaction(function () use ($teamId, $data) {
            $virtual = app(TeamVirtualModel::class, [], true);
            $virtual->save([
                'team_id' => $teamId,
                'name' => $data['name'],
                'avatar' => $data['avatar'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => 1,
            ]);
            $identity = app(\app\service\EntityIdentity::class)
                ->claimVirtual($virtual, (string) $data['slug']);

            return ['slug' => $identity->slug];
        });
    }

    public function update(int $teamId, string $slug, array $data): void
    {
        $this->validate('update', $data);
        $allow = array_intersect_key($data, array_flip(['name', 'avatar', 'description', 'is_active']));
        if ($allow) {
            $this->virtual($teamId, $slug)->save($allow);
        }
    }

    public function delete(int $teamId, string $slug): void
    {
        $virtual = $this->virtual($teamId, $slug);
        \think\facade\Db::transaction(function () use ($teamId, $slug, $virtual) {
            foreach (TeamVirtualIntegration::where('virtual_id', $virtual->id)->select() as $integration) {
                $integration->delete();
            }
            foreach (TeamEntityFieldValue::where('team_id', $teamId)
                ->where('entity_type', 'virtual')->where('entity_id', $virtual->id)->select() as $value) {
                $value->delete();
            }
            foreach (TeamRolePermission::where('team_id', $teamId)
                ->whereIn('permission_key', [
                    "chat.virtual.{$slug}.manage",
                    "chat.virtual.{$slug}.operate",
                    "chat.virtual.{$slug}.field.manage",
                ])->select() as $permission) {
                $permission->delete();
            }
            $identity = EntityIdentity::virtual()->where('entityable_id', $virtual->id)->find();
            if ($identity) {
                $identity->delete();
            }
            $virtual->delete();
        });
    }

    public function model(int $teamId, string $slug): TeamVirtualModel
    {
        return $this->virtual($teamId, $slug);
    }

    private function virtual(int $teamId, string $slug): TeamVirtualModel
    {
        $identity = EntityIdentity::virtual()->where('slug', strtolower(trim($slug)))->find();
        $virtual = $identity ? TeamVirtualModel::where('team_id', $teamId)->find($identity->entityable_id) : null;
        if (!$virtual) {
            throw new HttpException(404, '虚拟实体不存在');
        }
        return $virtual;
    }

    private function validate(string $scene, array $data): void
    {
        $validator = new \app\validate\ChatVirtual;
        if (!$validator->scene($scene)->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
