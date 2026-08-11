<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum BenefitPricingMode: int implements EnumTransform
{
    case LegacyEqualSplit = 1;
    case Itemized = 2;

    public function value(): string
    {
        return match ($this) {
            self::LegacyEqualSplit => '历史均摊',
            self::Itemized => '分项计价',
        };
    }
}
