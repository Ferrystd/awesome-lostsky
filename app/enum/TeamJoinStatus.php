<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum TeamJoinStatus: int implements EnumTransform
{
    case Applied   = 1;
    case Reviewing = 2;
    case Cancelled = 3;
    case Joined    = 4;
    case Rejected  = 5;

    public function value(): string
    {
        return match ($this) {
            self::Applied   => '已申请',
            self::Reviewing => '审核中',
            self::Cancelled => '已取消',
            self::Joined    => '已加入',
            self::Rejected  => '已拒绝',
        };
    }
}
