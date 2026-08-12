<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;

final class ShopAvailability
{
    public function open(int $teamId): bool
    {
        $enabled = (bool) (app(TeamSetting::class)->internal($teamId, 'shop')['enabled'] ?? false);
        return $enabled && app(AbilityResolver::class)->available($teamId, 'shop');
    }

    public function assertOpen(int $teamId): void
    {
        if (!$this->open($teamId)) throw new HttpException(403, '商品暂未开放');
    }
}
