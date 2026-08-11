<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ServiceDistributionMode: int implements EnumTransform
{
    case Fixed = 1;
    case Rate = 2;

    public function value(): string
    {
        return match ($this) {
            self::Fixed => '固定金额',
            self::Rate => '按比例',
        };
    }
}
