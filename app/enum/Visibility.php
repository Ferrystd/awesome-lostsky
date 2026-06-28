<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum Visibility: int implements EnumTransform
{
    case Team              = 1;
    case TeamExceptSubject = 2;
    case SubjectTeam       = 3;
    case Member            = 4;
    case Public            = 5;
    case Custom            = 6;

    public function value(): string
    {
        return match ($this) {
            self::Team              => '团队管理可见',
            self::TeamExceptSubject => '团队管理可见，不含主体本人',
            self::SubjectTeam       => '主体本人和团队管理可见',
            self::Member            => '团队成员可见',
            self::Public            => '公开可见',
            self::Custom            => '指定对象可见',
        };
    }
}
