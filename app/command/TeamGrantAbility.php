<?php
declare(strict_types=1);

namespace app\command;

use app\model\Team;
use app\model\TeamAbility;
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
            ->setDescription('向团队授予能力')
            ->addOption('team', null, Option::VALUE_REQUIRED, '团队 ID')
            ->addOption('ability', null, Option::VALUE_REQUIRED, '能力标识')
            ->addOption('level', null, Option::VALUE_OPTIONAL, '能力等级', '1')
            ->addOption('expire-time', null, Option::VALUE_OPTIONAL, '过期时间戳，0 表示永久', '0');
    }

    protected function execute(Input $input, Output $output): int
    {
        $teamId = $this->positiveInteger($input->getOption('team'));
        $abilityKey = trim((string) $input->getOption('ability'));
        $level = $this->positiveInteger($input->getOption('level'));
        $expireTime = $this->nonNegativeInteger($input->getOption('expire-time'));

        if ($teamId === null
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

        $ability = Db::transaction(function () use ($teamId, $abilityKey, $level, $expireTime): ?TeamAbility {
            $team = Team::where('id', $teamId)->lock(true)->find();
            if (!$team) {
                return null;
            }

            $ability = TeamAbility::withTrashed()
                ->where('team_id', $teamId)
                ->where('ability_key', $abilityKey)
                ->lock(true)
                ->find();

            if ($ability) {
                $ability->restore();
                $ability->save([
                    'level' => $level,
                    'expire_time' => $expireTime,
                ]);
            } else {
                $ability = new TeamAbility;
                $ability->save([
                    'team_id' => $teamId,
                    'ability_key' => $abilityKey,
                    'level' => $level,
                    'expire_time' => $expireTime,
                ]);
            }

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
            $output->writeln("<error>团队 {$teamId} 不存在</error>");
            return 1;
        }

        $expiry = $expireTime === 0 ? '永久' : (string) $expireTime;
        $output->writeln(
            "<info>已向团队 {$teamId} 授予 {$abilityKey}，等级 {$level}，有效期 {$expiry}</info>"
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
