<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamAbility;

class TeamAccess
{
    public function snapshot(int $teamId, array $actingEntity): array
    {
        return [
            'permissions' => app(PermissionGate::class)->effective($teamId, $actingEntity),
            'abilities' => [
                'file' => $this->ability($teamId, 'file', '文件上传'),
                'doc' => $this->ability($teamId, 'doc', '文档'),
            ],
        ];
    }

    public function ability(int $teamId, string $key, string $label, int $minimumLevel = 1): array
    {
        $ability = TeamAbility::where('team_id', $teamId)
            ->where('ability_key', $key)
            ->find();
        $enabled = $ability ? $ability->isAvailable($minimumLevel) : false;
        $reason = null;
        if (!$ability) {
            $reason = 'missing';
        } elseif ((int) $ability->level < $minimumLevel) {
            $reason = 'level';
        } elseif ((int) $ability->expire_time > 0 && (int) $ability->expire_time < time()) {
            $reason = 'expired';
        }

        return [
            'enabled' => $enabled,
            'level' => $ability ? (int) $ability->level : 0,
            'expire_time' => $ability ? (int) $ability->expire_time : 0,
            'reason' => $reason,
            'label' => $label,
        ];
    }
}
