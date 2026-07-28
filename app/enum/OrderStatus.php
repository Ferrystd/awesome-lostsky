<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum OrderStatus: int implements EnumTransform
{
    case Processing = 1;
    case Completed  = 2;
    case Cancelled  = 3;

    public function value(): string
    {
        return match ($this) {
            self::Processing => '处理中',
            self::Completed  => '已完成',
            self::Cancelled  => '已取消',
        };
    }
}
