<?php
declare(strict_types=1);

namespace app\log;

use think\log\driver\File;

/**
 * 每行一个 JSON 对象的文件日志驱动。
 */
final class JsonFile extends File
{
    public function save(array $log): bool
    {
        if (!empty($this->config['close'])) {
            return true;
        }

        $destination = $this->getMasterLogFile();
        $path = dirname($destination);
        !is_dir($path) && mkdir($path, 0755, true);

        $messages = [];
        foreach ($log as $record) {
            $filename = $destination;
            if (true === $this->config['apart_level'] || in_array($record->type, $this->config['apart_level'], true)) {
                $filename = $this->getApartLevelFile($path, $record->type);
            }

            $payload = [
                'time' => $record->time->format($this->config['time_format']),
                'level' => $record->type,
            ];
            if (is_array($record->message)) {
                $payload += $record->message;
            } else {
                $payload += [
                    'event' => 'application.message',
                    'message' => (string) $record->message,
                ];
            }

            $messages[$filename][] = json_encode(
                $payload,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
            );
        }

        foreach ($messages as $filename => $message) {
            $this->write($message, $filename);
        }

        return true;
    }
}
