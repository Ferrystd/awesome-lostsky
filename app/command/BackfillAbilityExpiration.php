<?php
declare(strict_types=1);

namespace app\command;

use app\model\TeamAbilityGrant;
use app\service\AbilityExpirationScheduler;
use think\console\Command;
use think\console\Input;
use think\console\Output;

final class BackfillAbilityExpiration extends Command
{
    protected function configure(): void
    {
        $this->setName('ability:expiration:backfill')
            ->setDescription('为已有有限期 Ability Grant 补投到期任务');
    }

    protected function execute(Input $input, Output $output): int
    {
        $count = 0;
        TeamAbilityGrant::where('ends_at', '>', 0)->whereNull('revoked_at')
            ->order('id')->chunk(200, function ($grants) use (&$count): void {
                foreach ($grants as $grant) {
                    app(AbilityExpirationScheduler::class)->schedule($grant);
                    $count++;
                }
            });
        $output->writeln("<info>已补投 {$count} 个 Ability 到期任务</info>");
        return 0;
    }
}
