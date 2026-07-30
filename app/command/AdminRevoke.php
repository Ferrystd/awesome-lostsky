<?php
declare(strict_types=1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

final class AdminRevoke extends Command
{
    protected function configure(): void
    {
        $this->setName('admin:revoke')
            ->setDescription('撤销用户的平台管理员角色')
            ->addOption('user', null, Option::VALUE_REQUIRED, '用户 ID')
            ->addOption('role', null, Option::VALUE_OPTIONAL, '角色标识', 'super_admin');
    }

    protected function execute(Input $input, Output $output): int
    {
        $userId = (int) $input->getOption('user');
        $role = trim((string) $input->getOption('role'));
        if ($userId < 1 || $role === '') {
            $output->writeln('<error>请提供有效的 --user 和 --role</error>');
            return 1;
        }
        app(\app\service\PlatformAdminAccess::class)->revokeByKey($userId, $role);
        $output->writeln("<info>已撤销用户 {$userId} 的 {$role}</info>");
        return 0;
    }
}
