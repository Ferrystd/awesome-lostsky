<?php
declare(strict_types=1);

namespace app\command;

use app\service\WeiboFeedPoller;
use think\console\Command;
use think\console\Input;
use think\console\Output;

final class WeiboFeedPoll extends Command
{
    protected function configure()
    {
        $this->setName('weibo:feed-poll')->setDescription('单次拉取并分类微博陪玩点单信息流');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln(json_encode(app(WeiboFeedPoller::class)->run(), JSON_UNESCAPED_UNICODE));
        return 0;
    }
}
