<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ServiceAdjustmentStatus: int implements EnumTransform
{
    case Pending = 1;
    case Accepted = 2;
    case Cancelled = 3;

    public function value(): string
    {
        return match ($this) {
            self::Pending => '待客户确认',
            self::Accepted => '已确认',
            self::Cancelled => '已取消',
        };
    }
}
