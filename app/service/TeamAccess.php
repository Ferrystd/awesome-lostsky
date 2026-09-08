<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use think\Request;

class TeamAccess
{
    public function snapshot(int $teamId, array $actingEntity, ?Request $request = null): array
    {
        $workspace = app(WorkspaceAccess::class)->inspect($teamId, $actingEntity);
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);

        return [
            'team' => app(IdentitySession::class)->teamSummary($teamId),
            'permissions' => app(PermissionGate::class)->effective($teamId, $actingEntity),
            'abilities' => [
                'file' => $this->fileAbility($teamId),
                'doc' => $this->ability($teamId, 'doc', '文档'),
                'transaction' => $this->ability($teamId, 'transaction', '记账'),
                'shop' => $this->ability($teamId, 'shop', '商城'),
                'weibo' => $this->ability($teamId, 'weibo', '微博'),
            ],
            'file_upload' => app(File::class)->uploadAvailability($teamId),
            'identity' => $this->identitySummary($actingEntity, $workspace),
            'entry_warning' => app(WorkspaceWarning::class)->state(
                $teamId,
                $entityId,
                (bool) $workspace['is_external'],
                $request
            ),
        ];
    }

    private function identitySummary(array $actingEntity, array $workspace): array
    {
        $type = (string) ($actingEntity['type'] ?? '');
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        $entity = $entityId > 0 ? Entity::with(['profile'])->find($entityId) : null;

        return [
            'type' => $type,
            'entity_id' => $entityId,
            'name' => (string) ($entity?->profile?->name ?: app(IdentitySession::class)->entityName(
                $type,
                (int) ($actingEntity['id'] ?? 0)
            )),
            'slug' => $entity?->slug ?: null,
            'avatar' => $entity?->profile?->avatar ?: null,
            'belongs_to_team' => (bool) $workspace['belongs_to_team'],
            'is_external' => (bool) $workspace['is_external'],
        ];
    }

    public function ability(int $teamId, string $key, string $label, int $minimumLevel = 1): array
    {
        $ability = app(AbilityResolver::class)->resolve($teamId, $key, $minimumLevel);

        return [
            'enabled' => $ability['enabled'],
            'level' => $ability['level'],
            'expire_time' => $ability['expire_time'],
            'reason' => $ability['reason'],
            'label' => $label,
        ];
    }

    public function fileAbility(int $teamId): array
    {
        $ability = app(File::class)->capacityAbility($teamId);

        return [
            'enabled' => true,
            'level' => $ability['level'],
            'expire_time' => $ability['expire_time'],
            'reason' => null,
            'label' => '文件上传',
        ];
    }
}
