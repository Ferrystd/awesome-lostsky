<?php
declare(strict_types=1);

namespace app\command;

use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamAbilityGrant;
use app\service\AbilityResolver;
use app\service\BusinessAudit;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;
use think\facade\Db;

final class TeamGrantAbility extends Command
{
    protected function configure(): void
    {
        $this->setName('team:grant-ability')
            ->setDescription('向团队授予能力（doc、file、transaction、shop）')
            ->addOption('team', null, Option::VALUE_REQUIRED, '团队 slug')
            ->addOption('ability', null, Option::VALUE_REQUIRED, '能力标识：doc、file、transaction、shop')
            ->addOption('level', null, Option::VALUE_OPTIONAL, '能力等级', '1')
            ->addOption('expire-time', null, Option::VALUE_OPTIONAL, '过期时间戳，0 表示永久', '0');
    }

    protected function execute(Input $input, Output $output): int
    {
        $teamSlug = trim((string) $input->getOption('team'));
        $abilityKey = trim((string) $input->getOption('ability'));
        $level = $this->positiveInteger($input->getOption('level'));
        $expireTime = $this->nonNegativeInteger($input->getOption('expire-time'));

        if ($teamSlug === ''
            || $abilityKey === ''
            || mb_strlen($abilityKey) > 50
            || str_contains($abilityKey, ',')
            || str_contains($abilityKey, ':')
            || $level === null
            || $expireTime === null) {
            $output->writeln(
                '<error>请提供有效的 --team、--ability、--level 和 --expire-time</error>'
            );
            return 1;
        }

        $ability = Db::transaction(function () use ($teamSlug, $abilityKey, $level, $expireTime): ?TeamAbility {
            $team = Team::where('slug', $teamSlug)->lock(true)->find();
            if (!$team) {
                return null;
            }
            $teamId = (int) $team->id;

            TeamAbilityGrant::where('team_id', $teamId)
                ->where('ability_key', $abilityKey)
                ->where('source_type', 'manual')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => time(), 'revoke_reason' => 'replaced']);
            $grant = new TeamAbilityGrant;
            $grant->save([
                'team_id' => $teamId,
                'ability_key' => $abilityKey,
                'level' => $level,
                'starts_at' => time(),
                'ends_at' => $expireTime,
                'source_type' => 'manual',
            ]);
            app(AbilityResolver::class)->syncProjection($teamId, $abilityKey);
            app(\app\service\AbilityExpirationScheduler::class)->schedule($grant);
            $ability = TeamAbility::where('team_id', $teamId)->where('ability_key', $abilityKey)->find();

            app(BusinessAudit::class)->recordPlatform(
                null,
                'ability.grant',
                'team_ability',
                (int) $ability->id,
                [
                    'team_id' => $teamId,
                    'ability_key' => $abilityKey,
                    'level' => $level,
                    'expire_time' => $expireTime,
                ]
            );

            return $ability;
        });

        if (!$ability) {
            $output->writeln("<error>团队 {$teamSlug} 不存在</error>");
            return 1;
        }

        $expiry = $expireTime === 0 ? '永久' : (string) $expireTime;
        $output->writeln(
            "<info>已向团队 {$teamSlug} 授予 {$abilityKey}，等级 {$level}，有效期 {$expiry}</info>"
        );
        return 0;
    }

    private function positiveInteger(mixed $value): ?int
    {
        $integer = $this->nonNegativeInteger($value);

        return $integer !== null && $integer > 0 ? $integer : null;
    }

    private function nonNegativeInteger(mixed $value): ?int
    {
        $value = trim((string) $value);
        if ($value === '' || !ctype_digit($value)) {
            return null;
        }

        $integer = filter_var(
            $value,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 0, 'max_range' => 4294967295]]
        );

        return $integer === false ? null : $integer;
    }
}
