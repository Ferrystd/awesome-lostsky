<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum LogType: int implements EnumTransform
{
    case Recharge = 1;
    case Consume  = 2;
    case Refund   = 3;
    case Adjust   = 4;

    public function value(): string
    {
        return match ($this) {
            self::Recharge => '充值',
            self::Consume  => '消费',
            self::Refund   => '退款',
            self::Adjust   => '手动调整',
        };
    }
}
