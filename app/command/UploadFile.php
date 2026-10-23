<?php
declare(strict_types=1);

namespace app\command;

use app\support\CommandResult;

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
            ->addOption('entity_id', null, Option::VALUE_OPTIONAL, '实体身份ID(entity.id)')
            ->addOption('team_id', null, Option::VALUE_OPTIONAL, '团队ID')
            ->addOption('name', null, Option::VALUE_OPTIONAL, '覆盖原始文件名')
            ->setDescription('上传本地文件到 OSS 并写入 file 记录');
    }

    protected function execute(Input $input, Output $output)
    {
        $filePath = (string) $input->getArgument('file');
        $entityId = $this->toNullableInt($input->getOption('entity_id'));
        $teamId   = $this->toNullableInt($input->getOption('team_id'));
        $name     = $this->toNullableString($input->getOption('name'));

        try {
            $result = app(FileService::class)->uploadByCommand(
                $filePath,
                $entityId,
                $teamId,
                $name
            );

            return CommandResult::write($output, 0, 'ok', $result);
        } catch (Throwable $e) {
            $httpCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            return CommandResult::write($output, 1, $e->getMessage(), [
                'http_code' => $httpCode,
            ]);
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
