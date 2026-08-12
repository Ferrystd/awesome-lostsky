<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamAbilityGrant;
use think\facade\Queue;

final class AbilityExpirationScheduler
{
    public const QUEUE = 'ability-expiration';

    public function schedule(TeamAbilityGrant $grant): ?int
    {
        $endsAt = (int) $grant->ends_at;
        if ($endsAt < 1) return null;

        return (int) Queue::later(max(0, $endsAt + 1 - time()), 'ExpireTeamAbility', [
            'team_id' => (int) $grant->team_id,
            'ability_key' => (string) $grant->ability_key,
            'expected_level' => (int) $grant->level,
            'expected_expire_time' => $endsAt,
            'expire_time' => $endsAt,
        ], self::QUEUE);
    }
}
