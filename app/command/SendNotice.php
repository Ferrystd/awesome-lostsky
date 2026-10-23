<?php
declare (strict_types = 1);

namespace app\command;

use app\support\CommandResult;

use app\service\Notice as NoticeService;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Argument;
use think\console\input\Option;
use think\console\Output;

class SendNotice extends Command
{
    protected function configure()
    {
        // 指令配置
        $this->setName('notice:send')
            ->addArgument('title', Argument::REQUIRED, '通知标题')
            ->addOption('team_id', null, Option::VALUE_REQUIRED, '目标团队 ID')
            ->addOption('content', null, Option::VALUE_OPTIONAL, '通知正文（Markdown）')
            ->addOption('pinned', null, Option::VALUE_NONE, '置顶通知')
            ->setDescription('向指定团队发送公告通知');
    }

    protected function execute(Input $input, Output $output)
    {
        // 指令输出
        try {
            $result = app(NoticeService::class)->send(
                (int) $input->getOption('team_id'),
                (string) $input->getArgument('title'),
                $this->nullableString($input->getOption('content')),
                (bool) $input->getOption('pinned')
            );

            return CommandResult::write($output, 0, 'ok', $result);
        } catch (Throwable $e) {
            $httpCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            return CommandResult::write($output, 1, $e->getMessage(), [
                'http_code' => $httpCode,
            ]);
        }
    }

    private function nullableString($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
