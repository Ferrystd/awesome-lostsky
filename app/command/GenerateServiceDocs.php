<?php
declare(strict_types=1);

namespace app\command;

use ReflectionClass;
use ReflectionIntersectionType;
use ReflectionMethod;
use ReflectionNamedType;
use ReflectionParameter;
use ReflectionType;
use ReflectionUnionType;
use RuntimeException;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

class GenerateServiceDocs extends Command
{
    protected function configure()
    {
        $this->setName('docs:services')
            ->addOption('check', null, Option::VALUE_NONE, '只校验文档是否最新，不写入文件')
            ->setDescription('生成 app/service 的 public 方法字典');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            $target = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'docs'
                . DIRECTORY_SEPARATOR . 'dev'
                . DIRECTORY_SEPARATOR . 'glossary'
                . DIRECTORY_SEPARATOR . 'service.md';
            $content = $this->render();

            if ((bool) $input->getOption('check')) {
                if (!DictionaryTemplate::matchesFile($target, $content)) {
                    $output->writeln('<error>Service 字典已过期，请运行 php think docs:services</error>');
                    return 1;
                }

                $output->writeln('<info>Service 字典已是最新状态</info>');
                return 0;
            }

            if (is_file($target) && file_get_contents($target) === $content) {
                $output->writeln('<info>Service 字典无需更新</info>');
                return 0;
            }

            if (file_put_contents($target, $content, LOCK_EX) === false) {
                throw new RuntimeException('无法写入 Service 字典');
            }

            $output->writeln('<info>Service 字典已更新：docs/dev/glossary/service.md</info>');
            return 0;
        } catch (Throwable $exception) {
            $output->writeln('<error>' . $exception->getMessage() . '</error>');
            return 1;
        }
    }

    private function render(): string
    {
        $serviceDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'service';
        $files = glob($serviceDirectory . DIRECTORY_SEPARATOR . '*.php');
        if ($files === false) {
            throw new RuntimeException('无法读取 app/service');
        }
        sort($files, SORT_STRING);

        $lines = [];

        foreach ($files as $file) {
            $shortName = pathinfo($file, PATHINFO_FILENAME);
            $className = 'app\\service\\' . $shortName;
            if (!class_exists($className)) {
                throw new RuntimeException("无法加载 Service：{$className}");
            }

            $reflection = new ReflectionClass($className);
            if (
                $reflection->getNamespaceName() !== 'app\\service'
                || realpath((string) $reflection->getFileName()) !== realpath($file)
            ) {
                throw new RuntimeException("无效的 Service：{$className}");
            }

            $methods = array_values(array_filter(
                $reflection->getMethods(ReflectionMethod::IS_PUBLIC),
                static fn (ReflectionMethod $method): bool =>
                    $method->getDeclaringClass()->getName() === $className
                    && $method->getName() !== '__construct'
            ));
            usort(
                $methods,
                static fn (ReflectionMethod $left, ReflectionMethod $right): int =>
                    ($left->getStartLine() ?: 0) <=> ($right->getStartLine() ?: 0)
            );

            $lines[] = "## {$shortName}";
            $lines[] = '';
            $lines[] = '| 方法 | 参数 | 返回 |';
            $lines[] = '| --- | --- | --- |';
            foreach ($methods as $method) {
                $parameters = array_map(
                    fn (ReflectionParameter $parameter): string => $this->formatParameter($parameter),
                    $method->getParameters()
                );
                $parameterList = $parameters === [] ? '—' : implode('、', $parameters);
                $returnType = $this->escapeTable($this->formatType($method->getReturnType()));
                $lines[] = "| `{$method->getName()}` | {$parameterList} | `{$returnType}` |";
            }
            $lines[] = '';
        }

        return DictionaryTemplate::render(
            dirname(__DIR__, 2) . '/Templates/dictionaries/services.md',
            ['services.methods' => rtrim(implode("\n", $lines))]
        );
    }

    private function formatParameter(ReflectionParameter $parameter): string
    {
        $type = $this->formatType($parameter->getType());
        $variadic = $parameter->isVariadic() ? '...' : '';
        $text = "{$type} {$variadic}\${$parameter->getName()}";
        if ($parameter->isDefaultValueAvailable()) {
            $default = $parameter->isDefaultValueConstant()
                ? $parameter->getDefaultValueConstantName()
                : $this->formatDefault($parameter->getDefaultValue());
            $text .= " = {$default}";
        }

        return '`' . $this->escapeTable($text) . '`';
    }

    private function formatType(?ReflectionType $type): string
    {
        if ($type === null) {
            return 'mixed';
        }
        if ($type instanceof ReflectionNamedType) {
            $name = $type->getName();
            if (!$type->isBuiltin()) {
                $name = str_starts_with($name, 'app\\') ? substr($name, 4) : ltrim($name, '\\');
            }

            return $type->allowsNull() && $name !== 'mixed' && $name !== 'null'
                ? '?' . $name
                : $name;
        }
        if ($type instanceof ReflectionUnionType) {
            return implode('|', array_map(
                fn (ReflectionNamedType $member): string => $this->formatType($member),
                $type->getTypes()
            ));
        }
        if ($type instanceof ReflectionIntersectionType) {
            return implode('&', array_map(
                fn (ReflectionNamedType $member): string => $this->formatType($member),
                $type->getTypes()
            ));
        }

        return (string) $type;
    }

    private function formatDefault(mixed $value): string
    {
        if ($value === null) {
            return 'null';
        }
        if ($value === []) {
            return '[]';
        }
        if (is_array($value)) {
            return (string) json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        return var_export($value, true);
    }

    private function escapeTable(string $value): string
    {
        return str_replace('|', '\\|', $value);
    }
}
