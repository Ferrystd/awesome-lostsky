<?php
declare(strict_types=1);

namespace app\service;


class TeamAccess
{
    public function snapshot(int $teamId, array $actingEntity): array
    {
        return [
            'team' => app(IdentitySession::class)->teamSummary($teamId),
            'permissions' => app(PermissionGate::class)->effective($teamId, $actingEntity),
            'abilities' => [
                'file' => $this->ability($teamId, 'file', '文件上传'),
                'doc' => $this->ability($teamId, 'doc', '文档'),
                'transaction' => $this->ability($teamId, 'transaction', '记账'),
            ],
            'identity' => ['type' => (string) ($actingEntity['type'] ?? '')],
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
}
