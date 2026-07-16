<?php
declare(strict_types=1);

namespace app\command;

use app\service\File as FileService;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Argument;
use think\console\input\Option;
use think\console\Output;

class UploadFile extends Command
{
    protected function configure()
    {
        $this->setName('file:upload')
            ->addArgument('file', Argument::REQUIRED, '本地文件路径')
            ->addOption('member_id', null, Option::VALUE_OPTIONAL, '成员ID')
            ->addOption('team_id', null, Option::VALUE_OPTIONAL, '团队ID')
            ->addOption('name', null, Option::VALUE_OPTIONAL, '覆盖原始文件名')
            ->setDescription('上传本地文件到 OSS 并写入 file 记录');
    }

    protected function execute(Input $input, Output $output)
    {
        $filePath = (string) $input->getArgument('file');
        $memberId = $this->toNullableInt($input->getOption('member_id'));
        $teamId   = $this->toNullableInt($input->getOption('team_id'));
        $name     = $this->toNullableString($input->getOption('name'));

        try {
            $result = app(FileService::class)->uploadByCommand(
                $filePath,
                $memberId,
                $teamId,
                $name
            );

            $output->writeln((string) json_encode([
                'code'    => 0,
                'message' => 'ok',
                'data'    => $result,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

            return 0;
        } catch (Throwable $e) {
            $httpCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            $output->writeln((string) json_encode([
                'code'    => 1,
                'message' => $e->getMessage(),
                'data'    => [
                    'http_code' => $httpCode,
                ],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

            return 1;
        }
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function toNullableString($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
