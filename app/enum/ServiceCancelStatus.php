<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ServiceCancelStatus: int implements EnumTransform
{
    case Pending = 1;
    case Approved = 2;
    case Rejected = 3;

    public function value(): string
    {
        return match ($this) {
            self::Pending => '待处理',
            self::Approved => '已同意',
            self::Rejected => '已拒绝',
        };
    }
}
