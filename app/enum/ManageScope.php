<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ManageScope: int implements EnumTransform
{
    case Team        = 1;
    case SubjectTeam = 2;

    public function value(): string
    {
        return match ($this) {
            self::Team        => '团队管理',
            self::SubjectTeam => '主体本人和团队管理',
        };
    }
}
