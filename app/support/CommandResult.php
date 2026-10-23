<?php
declare(strict_types=1);

namespace app\support;

use think\console\Output;

final class CommandResult
{
    public static function write(Output $output, int $code, string $message, mixed $data = null): int
    {
        $output->writeln((string) json_encode([
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

        return $code;
    }
}
