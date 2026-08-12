<?php
declare(strict_types=1);

namespace app\job;

use app\event\TeamAbilityExpired;
use app\model\TeamAbility;
use app\model\TeamAbilityGrant;
use app\service\AbilityResolver;
use app\service\TeamSetting;
use think\facade\Db;
use think\facade\Event;
use think\queue\Job;

final class ExpireTeamAbility
{
    public function fire(Job $job, array $data): void
    {
        try {
            Db::transaction(function () use ($data): void {
                $teamId = (int) ($data['team_id'] ?? 0);
                $key = trim((string) ($data['ability_key'] ?? ''));
                $expiredAt = (int) ($data['expire_time'] ?? 0);
                $expectedLevel = (int) ($data['expected_level'] ?? 0);
                $expectedExpireTime = (int) ($data['expected_expire_time'] ?? 0);
                if (
                    $teamId < 1 || $key === '' || $expiredAt < 1 || $expectedLevel < 1
                    || $expectedExpireTime !== $expiredAt
                ) return;

                $scheduledGrantExists = TeamAbilityGrant::where('team_id', $teamId)
                    ->where('ability_key', $key)
                    ->where('level', $expectedLevel)
                    ->where('ends_at', $expectedExpireTime)
                    ->whereNull('revoked_at')
                    ->find();
                if (!$scheduledGrantExists) return;

                $projection = TeamAbility::where('team_id', $teamId)
                    ->where('ability_key', $key)->lock(true)->find();
                if (!$projection) return;

                $current = app(AbilityResolver::class)->resolveGrants($teamId, $key, 1, time());
                $previousLevel = (int) $projection->level;
                if ((int) $current['level'] >= $previousLevel) return;

                $projection->save([
                    'level' => (int) $current['level'],
                    'expire_time' => (int) $current['expire_time'],
                ]);
                $shopClosed = false;
                if ($key === 'shop' && (int) $current['level'] < 1) {
                    $shopClosed = app(TeamSetting::class)->closeShop($teamId);
                }
                Event::trigger(new TeamAbilityExpired(
                    $teamId,
                    $key,
                    $previousLevel,
                    (int) $current['level'],
                    $expiredAt,
                    $shopClosed
                ));
            });
            $job->delete();
        } catch (\Throwable $exception) {
            $job->release(min(3600, 30 * (2 ** min(6, max(0, $job->attempts() - 1)))));
        }
    }
}
