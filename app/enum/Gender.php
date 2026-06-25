<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum Gender: int implements EnumTransform
{
    case Unknown = 0;
    case Male    = 1;
    case Female  = 2;

    public function value(): string
    {
        return match ($this) {
            self::Unknown => '未知',
            self::Male    => '男',
            self::Female  => '女',
        };
    }
}
