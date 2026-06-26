<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum DocTarget: string implements EnumTransform
{
    case Team   = 'team';
    case Member = 'member';
    case User   = 'user';

    public function value(): string
    {
        return match ($this) {
            self::Team   => '团队',
            self::Member => '成员',
            self::User   => '用户',
        };
    }
}
