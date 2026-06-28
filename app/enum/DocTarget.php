<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum DocTarget: string implements EnumTransform
{
    case Team   = 'team';
    case Member = 'teamMember';

    public function value(): string
    {
        return match ($this) {
            self::Team   => '团队',
            self::Member => '成员',
        };
    }
}
