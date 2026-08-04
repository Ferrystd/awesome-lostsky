<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamAbility;
use app\model\TeamAbilityGrant;

class AbilityResolver
{
    public function resolve(int $teamId, string $key, int $minimumLevel = 1, ?int $at = null): array
    {
        $at ??= time();
        $grants = TeamAbilityGrant::where('team_id', $teamId)
            ->where('ability_key', $key)
            ->where('starts_at', '<=', $at)
            ->whereNull('revoked_at')
            ->where(static function ($query) use ($at) {
                $query->where('ends_at', 0)->whereOr('ends_at', '>=', $at);
            })
            ->select();

        if (!$grants->isEmpty()) {
            $level = 0;
            foreach ($grants as $grant) $level = max($level, (int) $grant->level);
            $expires = [];
            foreach ($grants as $grant) {
                if ((int) $grant->level === $level) $expires[] = (int) $grant->ends_at;
            }
            $expireTime = in_array(0, $expires, true) ? 0 : max($expires);
            return $this->result($level, $expireTime, $minimumLevel, $at, 'grant');
        }

        $legacy = TeamAbility::where('team_id', $teamId)->where('ability_key', $key)->find();
        if (!$legacy) return $this->result(0, 0, $minimumLevel, $at, 'missing');

        return $this->result((int) $legacy->level, (int) $legacy->expire_time, $minimumLevel, $at, 'legacy');
    }

    public function available(int $teamId, string $key, int $minimumLevel = 1): bool
    {
        return $this->resolve($teamId, $key, $minimumLevel)['enabled'];
    }

    public function syncProjection(int $teamId, string $key): void
    {
        $resolved = $this->resolve($teamId, $key);
        $ability = TeamAbility::withTrashed()
            ->where('team_id', $teamId)->where('ability_key', $key)->find();
        if (!$ability) $ability = new TeamAbility;
        else $ability->restore();
        $ability->save([
            'team_id' => $teamId,
            'ability_key' => $key,
            'level' => $resolved['level'],
            'expire_time' => $resolved['expire_time'],
        ]);
    }

    private function result(int $level, int $expireTime, int $minimumLevel, int $at, string $source): array
    {
        $reason = null;
        if ($level < 1) $reason = 'missing';
        elseif ($level < $minimumLevel) $reason = 'level';
        elseif ($expireTime > 0 && $expireTime < $at) $reason = 'expired';

        return [
            'enabled' => $reason === null,
            'level' => $level,
            'expire_time' => $expireTime,
            'reason' => $reason,
            'source' => $source,
        ];
    }
}
