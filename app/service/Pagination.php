<?php
declare(strict_types=1);

namespace app\service;

final class Pagination
{
    public const DEFAULT_LIMIT = 20;
    public const MAX_LIMIT = 100;

    public function normalize(int $page, int $limit): array
    {
        return [
            max(1, $page),
            max(1, min(self::MAX_LIMIT, $limit)),
        ];
    }
}
