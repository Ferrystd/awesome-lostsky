<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum TeamJoinPurpose: int implements EnumTransform
{
    case Join = 1;
    case Reinstate = 2;

    public function value(): string
    {
        return match ($this) {
            self::Join => '加入',
            self::Reinstate => '复职',
        };
    }

    public function code(): string
    {
        return strtolower($this->name);
    }
}
