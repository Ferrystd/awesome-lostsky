<?php
declare(strict_types=1);

namespace app\command;

use RuntimeException;

final class DictionaryTemplate
{
    public static function matchesFile(string $path, string $content): bool
    {
        $existing = is_file($path) ? file_get_contents($path) : false;
        return $existing !== false
            && str_replace("\r\n", "\n", $existing) === str_replace("\r\n", "\n", $content);
    }

    public static function render(string $path, array $values): string
    {
        $template = file_get_contents($path);
        if ($template === false) {
            throw new RuntimeException("无法读取字典模板：{$path}");
        }
        foreach ($values as $name => $value) {
            if (!str_contains($template, '{{' . $name . '}}')) {
                throw new RuntimeException("模板缺少占位符：{$name}");
            }
        }
        $content = preg_replace_callback('/\{\{([^{}]+)\}\}/', static function (array $match) use ($values): string {
            if (!array_key_exists($match[1], $values)) {
                throw new RuntimeException("未知字典占位符：{$match[1]}");
            }
            return $values[$match[1]];
        }, str_replace("\r\n", "\n", $template));
        return rtrim($content) . "\n";
    }
}
