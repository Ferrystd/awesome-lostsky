<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;

class ChatCleanup extends Command
{
    protected function configure()
    {
        $this->setName('chat:cleanup')
            ->setDescription('关闭过期临时会话并执行消息保留策略');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln(json_encode(app(\app\service\ChatCleanup::class)->run(), JSON_UNESCAPED_UNICODE));
        return 0;
    }
}
