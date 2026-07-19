<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum MemberSearchPriority: string implements EnumTransform
{
    case Team   = 'team';
    case Member = 'member';

    public function value(): string
    {
        return match ($this) {
            self::Team   => '团队优先',
            self::Member => '成员优先',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Team   => '团队关闭搜索时，所有成员均不可被搜索。',
            self::Member => '成员的显式设置可以覆盖团队默认值。',
        };
    }
}
