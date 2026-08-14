<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ServiceAssignmentOfferStatus: int implements EnumTransform
{
    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
    case Withdrawn = 4;
    case Invalidated = 5;

    public function value(): string
    {
        return match ($this) {
            self::Pending => '待确认',
            self::Accepted => '已接受',
            self::Rejected => '已拒绝',
            self::Withdrawn => '已取消',
            self::Invalidated => '已失效',
        };
    }
}
