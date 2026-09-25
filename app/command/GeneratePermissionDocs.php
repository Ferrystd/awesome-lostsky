<?php
declare(strict_types=1);

namespace app\command;

use app\service\PermissionDictionary;
use RuntimeException;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

class GeneratePermissionDocs extends Command
{
    protected function configure()
    {
        $this->setName('docs:permissions')
            ->addOption('check', null, Option::VALUE_NONE, '只校验两侧权限字典，不写入文件')
            ->setDescription('从权限定义和模板生成开发侧、用户侧权限字典');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            $root = dirname(__DIR__, 2);
            $values = [
                'permissions.team' => $this->permissionTable(PermissionDictionary::groups()),
                'permissions.admin' => $this->permissionTable(PermissionDictionary::adminGroups()),
            ];
            $rows = ['| 模式 | 允许的操作与范围 |', '| --- | --- |'];
            foreach (PermissionDictionary::dynamicDescriptions() as $key => $description) {
                if (PermissionDictionary::dynamic(str_replace('<slug>', 'example', $key)) === null) {
                    throw new RuntimeException("动态权限模板无效：{$key}");
                }
                $rows[] = '| `' . $key . '` | ' . $this->escape($description) . ' |';
            }
            $values['permissions.dynamic'] = implode("\n", $rows);
            $documents = [];
            foreach ([
                'permissions-developer.md' => ['docs/dev/architecture/permissions.md', $values],
                'permissions-user.md' => ['docs/user/dictionary/permissions.md', array_diff_key($values, ['permissions.admin' => true])],
            ] as $template => [$target, $templateValues]) {
                $documents[$target] = DictionaryTemplate::render($root . '/Templates/dictionaries/' . $template, $templateValues);
            }
            $stale = false;
            foreach ($documents as $target => $content) {
                $path = $root . '/' . $target;
                if (is_file($path) && file_get_contents($path) === $content) {
                    continue;
                }
                $stale = true;
                if ($input->getOption('check')) {
                    $output->writeln("<error>权限字典已过期：{$target}；请运行 php think docs:permissions</error>");
                    continue;
                }
                if (!is_dir(dirname($path)) && !mkdir(dirname($path), 0777, true) && !is_dir(dirname($path))) {
                    throw new RuntimeException("无法创建字典目录：{$target}");
                }
                if (file_put_contents($path, $content, LOCK_EX) === false) {
                    throw new RuntimeException("无法写入权限字典：{$target}");
                }
                $output->writeln("<info>权限字典已更新：{$target}</info>");
            }
            if (!$stale) {
                $output->writeln('<info>两侧权限字典已是最新状态</info>');
            }
            return $stale && $input->getOption('check') ? 1 : 0;
        } catch (Throwable $exception) {
            $output->writeln('<error>' . $exception->getMessage() . '</error>');
            return 1;
        }
    }

    private function permissionTable(array $groups): string
    {
        $descriptions = PermissionDictionary::descriptions();
        $rows = ['| 分组 | Permission | 允许的操作与范围 |', '| --- | --- | --- |'];
        foreach ($groups as $group => $items) {
            foreach ($items as $key => $label) {
                if (!isset($descriptions[$key])) {
                    throw new RuntimeException("权限缺少完整说明：{$key}");
                }
                $rows[] = '| ' . $this->escape($group) . ' | `' . $key . '` | ' . $this->escape($descriptions[$key]) . ' |';
            }
        }
        return implode("\n", $rows);
    }

    private function escape(string $value): string
    {
        return str_replace(["\r", "\n", '|'], ['', '<br>', '\\|'], $value);
    }
}
