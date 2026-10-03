<?php
declare(strict_types=1);

namespace app\command;

use app\service\WeiboTasks;
use think\console\Command;
use think\console\Input;
use think\console\Output;

final class WeiboRecoverTasks extends Command
{
    protected function configure(): void
    {
        $this->setName('weibo:tasks-recover')->setDescription('为运行中微博任务补投缺失的数据库 Job');
    }

    protected function execute(Input $input, Output $output): int
    {
        $output->writeln(json_encode(['enqueued' => app(WeiboTasks::class)->recover()], JSON_UNESCAPED_UNICODE));
        return 0;
    }
}
