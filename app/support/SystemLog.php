<?php
declare(strict_types=1);

namespace app\support;

use Stringable;
use think\Log;
use Throwable;

/**
 * 系统运行日志入口，负责统一事件结构与敏感信息清理。
 */
final class SystemLog
{
    private const REDACTED = '[REDACTED]';

    public function __construct(private Log $log)
    {
    }

    public function write(string $level, string $event, array $context = []): void
    {
        try {
            $this->log->record([
                'event' => $event,
            ] + $this->sanitize($context), $level);
        } catch (Throwable) {
            // 日志基础设施失败不能中断业务请求或控制台命令。
        }
    }

    private function sanitize(array $context): array
    {
        $sanitized = [];
        foreach ($context as $key => $value) {
            $name = (string) $key;
            $sanitized[$name] = $this->isSensitiveKey($name)
                ? self::REDACTED
                : $this->sanitizeValue($value);
        }

        return $sanitized;
    }

    private function sanitizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            return $this->sanitize($value);
        }
        if (is_string($value) || $value instanceof Stringable) {
            $text = (string) $value;
            $text = preg_replace('/\bBearer\s+[^\s,;]+/i', 'Bearer ' . self::REDACTED, $text) ?? $text;
            $text = preg_replace(
                '/([?&](?:access[_-]?token|refresh[_-]?token|token|password|secret|signature)=)[^&\s]+/i',
                '$1' . self::REDACTED,
                $text
            ) ?? $text;

            return mb_substr($text, 0, 4000);
        }
        if (is_scalar($value) || $value === null) {
            return $value;
        }

        return is_object($value) ? $value::class : get_debug_type($value);
    }

    private function isSensitiveKey(string $key): bool
    {
        return (bool) preg_match(
            '/password|passwd|authorization|cookie|credential|secret|token|access[_-]?key|private[_-]?key/i',
            $key
        );
    }
}
