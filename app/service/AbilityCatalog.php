<?php
declare(strict_types=1);

namespace app\service;

final class AbilityCatalog
{
    private const ITEMS = [
        'doc' => ['label' => '文档', 'levels' => [1]],
        'file' => ['label' => '文件', 'levels' => [1, 2, 3]],
        'transaction' => ['label' => '流水', 'levels' => [1]],
        'shop' => ['label' => '商城', 'levels' => [1]],
        'weibo' => ['label' => '微博', 'levels' => [1]],
    ];

    public static function all(): array
    {
        $result = [];
        foreach (self::ITEMS as $key => $item) $result[] = ['key' => $key] + $item;
        return $result;
    }

    public static function label(string $key): string
    {
        return self::ITEMS[$key]['label'] ?? $key;
    }
}
