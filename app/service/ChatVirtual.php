<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use app\model\TeamEntityFieldValue;
use app\model\TeamRolePermission;
use app\model\TeamVirtual as TeamVirtualModel;
use app\model\TeamVirtualIntegration;
use think\exception\HttpException;

class ChatVirtual
{
    public function list(int $teamId, array $actingEntity, string $mode = 'manage'): array
    {
        $mode = $mode === 'operate' ? 'act' : 'manage';
        $gate = app(PermissionGate::class);
        $items = TeamVirtualModel::where('team_id', $teamId)
            ->with(['identity', 'profile', 'integrations'])
            ->select()
            ->filter(fn ($virtual) => $virtual->slug && $gate->allows($teamId, $actingEntity, [
                PermissionDictionary::virtual('*', $mode),
                PermissionDictionary::virtual((string) $virtual->slug, $mode),
            ]))
            ->toArray();
        usort($items, static fn (array $left, array $right): int => strcmp(
            (string) ($left['name'] ?? ''),
            (string) ($right['name'] ?? '')
        ));
        return array_values($items);
    }

    public function get(int $teamId, string $slug): array
    {
        $virtual = $this->virtual($teamId, $slug);
        return TeamVirtualModel::with(['identity', 'profile', 'integrations'])->find($virtual->id)->toArray();
    }

    public function create(int $teamId, array $data): array
    {
        $this->validate('create', $data);

        return \think\facade\Db::transaction(function () use ($teamId, $data) {
            $virtual = app(TeamVirtualModel::class, [], true);
            $virtual->save([
                'team_id' => $teamId,
                'is_active' => 1,
            ]);
            $identity = app(\app\service\Entity::class)
                ->claimVirtual($virtual, (string) $data['slug']);
            app(EntityProfile::class)->update($teamId, (int) $identity->id, [
                'name' => $data['name'],
                'avatar' => $data['avatar'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            return ['id' => (int) $identity->id, 'slug' => $identity->slug];
        });
    }

    public function update(int $teamId, string $slug, array $data): int
    {
        $this->validate('update', $data);
        $virtual = $this->virtual($teamId, $slug);
        $entityId = (int) app(\app\service\Entity::class)
            ->requireBySubject('teamVirtual', (int) $virtual->id)->id;
        if (array_key_exists('is_active', $data)) {
            $virtual->save(['is_active' => $data['is_active']]);
        }
        $profile = array_intersect_key($data, array_flip(['name', 'avatar', 'description']));
        if ($profile) {
            app(EntityProfile::class)->update($teamId, $entityId, $profile);
        }
        return $entityId;
    }

    public function delete(int $teamId, string $slug): int
    {
        $virtual = $this->virtual($teamId, $slug);
        $entityId = (int) app(\app\service\Entity::class)
            ->requireBySubject('teamVirtual', (int) $virtual->id)->id;
        \think\facade\Db::transaction(function () use ($teamId, $slug, $virtual, $entityId) {
            foreach (TeamVirtualIntegration::where('virtual_id', $virtual->id)->select() as $integration) {
                $integration->delete();
            }
            foreach (TeamEntityFieldValue::where('team_id', $teamId)
                ->where('entity_id', $entityId)->select() as $value) {
                $value->delete();
            }
            foreach (TeamRolePermission::where('team_id', $teamId)
                ->whereIn('permission_key', [
                    PermissionDictionary::virtual($slug, 'manage'),
                    PermissionDictionary::virtual($slug, 'act'),
                    PermissionDictionary::virtual($slug, 'field.manage'),
                ])->select() as $permission) {
                $permission->delete();
            }
            $identity = Entity::virtual()->where('entityable_id', $virtual->id)->find();
            if ($identity) {
                Entity::destroy((int) $identity->id);
            }
            TeamVirtualModel::destroy((int) $virtual->id);
        });
        return $entityId;
    }

    public function model(int $teamId, string $slug): TeamVirtualModel
    {
        return $this->virtual($teamId, $slug);
    }

    private function virtual(int $teamId, string $slug): TeamVirtualModel
    {
        $identity = Entity::virtual()->where('slug', strtolower(trim($slug)))->find();
        $virtual = $identity
            ? TeamVirtualModel::where('team_id', $teamId)->with(['profile'])->find($identity->entityable_id)
            : null;
        if (!$virtual) {
            throw new HttpException(404, '虚拟人员不存在');
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
