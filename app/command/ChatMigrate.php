<?php
declare(strict_types=1);

namespace app\command;

use app\service\ChatMigration;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

final class ChatMigrate extends Command
{
    protected function configure(): void
    {
        $this->setName('chat:migrate-teamless')
            ->addOption('apply', null, Option::VALUE_NONE, '执行迁移；省略时只输出统计')
            ->setDescription('统计或迁移 Chat teamless 历史数据');
    }

    protected function execute(Input $input, Output $output): int
    {
        try {
            $migration = app(ChatMigration::class);
            $result = $input->getOption('apply') ? $migration->apply() : $migration->inspect();
            $output->writeln(json_encode(
                $result,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR
            ));
            return 0;
        } catch (\Throwable $exception) {
            $output->writeln('<error>' . $exception->getMessage() . '</error>');
            return 1;
        }
    }
}
