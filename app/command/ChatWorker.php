<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

class ChatWorker extends Command
{
    protected function configure()
    {
        $this->setName('chat:worker')
            ->addOption('once', null, Option::VALUE_NONE, '仅处理一批事件')
            ->setDescription('处理聊天实时事件与Webhook投递');
    }

    protected function execute(Input $input, Output $output)
    {
        do {
            $result = app(\app\service\ChatOutbox::class)->runOnce();
            $output->writeln(json_encode($result, JSON_UNESCAPED_UNICODE));
            if ($input->getOption('once')) {
                break;
            }
            usleep(500000);
        } while (true);
        return 0;
    }
}
