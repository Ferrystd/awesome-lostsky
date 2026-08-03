<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum TeamMemberStatus: int implements EnumTransform
{
    case Active = 1;
    case Blocked = 2;
    case Departed = 3;

    public function value(): string
    {
        return match ($this) {
            self::Active => '正常',
            self::Blocked => '已封禁',
            self::Departed => '已离队',
        };
    }

    public function code(): string
    {
        return strtolower($this->name);
    }
}
