<?php
declare(strict_types=1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;

class SystemCleanup extends Command
{
    protected function configure()
    {
        $this->setName('system:cleanup')
            ->setDescription('执行核销自动结单、生命周期清理并重试外部补偿');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln(json_encode(
            app(\app\service\LifecycleCleanup::class)->run(),
            JSON_UNESCAPED_UNICODE
        ));
        return 0;
    }
}
