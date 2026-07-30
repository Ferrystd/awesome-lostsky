<?php
declare(strict_types=1);

namespace app\exception;

use think\exception\HttpException;

class AccessDeniedException extends HttpException
{
    private function __construct(
        int $errorCode,
        string $message,
        private readonly array $details
    ) {
        parent::__construct(403, $message, null, [], $errorCode);
    }

    public static function permission(array $requiredAny): self
    {
        $requiredAny = array_values(array_unique(array_filter(array_map('strval', $requiredAny))));
        $message = '缺少权限(Permission): ' . implode(' / ', $requiredAny);

        return new self(40302, $message, [
            'kind' => 'permission',
            'required_any' => $requiredAny,
        ]);
    }

    public static function ability(
        string $key,
        string $label,
        int $minimumLevel = 1,
        string $reason = 'missing'
    ): self {
        $message = "当前团队缺失能力(Ability): {$label}(" . ucfirst($key) . ')';

        return new self(40303, $message, [
            'kind' => 'ability',
            'key' => $key,
            'label' => $label,
            'minimum_level' => $minimumLevel,
            'reason' => $reason,
        ]);
    }

    public function data(): array
    {
        return $this->details;
    }
}
