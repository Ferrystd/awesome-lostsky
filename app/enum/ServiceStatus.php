<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ServiceStatus: int implements EnumTransform
{
    case Unredeemed = 1;
    case Processing = 2;
    case Redeemed = 3;

    public function value(): string
    {
        return match ($this) {
            self::Unredeemed => '未核销',
            self::Processing => '核销中',
            self::Redeemed => '已核销',
        };
    }
}
