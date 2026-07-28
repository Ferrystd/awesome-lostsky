<?php
declare(strict_types=1);

namespace app\exception;

use think\exception\HttpException;

class EntityContextException extends HttpException
{
    private function __construct(
        int $statusCode,
        int $errorCode,
        string $message,
        private readonly string $reason,
        private readonly string $teamSlug
    ) {
        parent::__construct($statusCode, $message, null, [], $errorCode);
    }

    public static function required(string $teamSlug): self
    {
        return new self(428, 42801, '需要先领取实体身份', 'missing', $teamSlug);
    }

    public static function teamMismatch(string $teamSlug): self
    {
        return new self(403, 40301, '当前实体身份不属于此团队', 'team_mismatch', $teamSlug);
    }

    public function data(): array
    {
        return [
            'reason' => $this->reason,
            'team_slug' => $this->teamSlug,
        ];
    }
}
