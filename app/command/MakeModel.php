<?php
declare (strict_types=1);

namespace app\command;

use think\console\command\Make;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

class MakeModel extends Make
{
    protected $type = "Model";

    protected function configure()
    {
        parent::configure();
        $this->setName('make:model')
            ->addOption('table', 't', Option::VALUE_OPTIONAL, '绑定的数据表名（默认自动识别）')
            ->addOption('module', 'm', Option::VALUE_OPTIONAL, '模块名（如 admin），默认为空')
            ->setDescription('根据项目模板创建 LostSky 模型');
    }

    protected function getStub(): string
    {
        return __DIR__ . DIRECTORY_SEPARATOR . 'stubs' . DIRECTORY_SEPARATOR . 'lostmodel.stub';
    }

    protected function getNamespace(string $app): string
    {
        return parent::getNamespace($app) . '\\model';
    }

    protected function execute(Input $input, Output $output)
    {
        $name = trim($input->getArgument('name'));

        $classname = $this->getClassName($name);

        $pathname = $this->getPathName($classname);

        if (is_file($pathname)) {
            $output->writeln('<error>' . $this->type . ': ' . $classname . ' 已存在！</error>');
            return false;
        }

        if (!is_dir(dirname($pathname))) {
            mkdir(dirname($pathname), 0755, true);
        }

        file_put_contents($pathname, $this->buildClass($classname, $input));

        $output->writeln('<info>' . $this->type . ': ' . $classname . ' 创建成功！</info>');
        $output->writeln('文件路径: ' . $pathname);
    }

    protected function buildClass(string $name, ?Input $input = null)
    {
        $stub = file_get_contents($this->getStub());

        $namespace = trim(implode('\\', array_slice(explode('\\', $name), 0, -1)), '\\');

        $class = str_replace($namespace . '\\', '', $name);

        // 处理表名：优先使用 --table 选项，否则自动生成
        $table = '';
        if ($input && $input->hasOption('table')) {
            $table = $input->getOption('table') ?: '';
        }

        // 预处理 {%if var%}...{%endif%} 条件块
        $stub = $this->processConditionals($stub, ['tableName' => $table]);

        return str_replace(
            ['{%className%}', '{%namespace%}', '{%app_namespace%}', '{%tableName%}'],
            [$class, $namespace, $this->app->getNamespace(), $table],
            $stub
        );
    }

    /**
     * 预处理 stub 中的 {%if var%}...{%endif%} 条件块
     * 变量为空时删除整个块，非空时仅去掉标记保留内容
     */
    protected function processConditionals(string $stub, array $vars): string
    {
        return preg_replace_callback(
            '/\r?\n?{%if\s+(\w+)%}(.*?){%endif%}\r?\n?/s',
            function ($matches) use ($vars) {
                $varName = $matches[1];
                $content = $matches[2];
                return !empty($vars[$varName]) ? $content : '';
            },
            $stub
        );
    }
}
