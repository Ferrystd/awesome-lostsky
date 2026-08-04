<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum RedemptionMode: string implements EnumTransform
{
    case Unique = '1';
    case Campaign = '2';
    case Targeted = '3';

    public function value(): string
    {
        return match ($this) {
            self::Unique => '独立卡密',
            self::Campaign => '公共活动码',
            self::Targeted => '定向卡密',
        };
    }
}
