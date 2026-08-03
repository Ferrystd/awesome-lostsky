<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum TeamMemberDepartureStatus: int implements EnumTransform
{
    case Applied = 1;
    case Cancelled = 2;
    case Approved = 3;
    case Rejected = 4;

    public function value(): string
    {
        return match ($this) {
            self::Applied => '申请中',
            self::Cancelled => '已取消',
            self::Approved => '已批准',
            self::Rejected => '已拒绝',
        };
    }

    public function code(): string
    {
        return strtolower($this->name);
    }
}
