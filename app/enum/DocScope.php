<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum DocScope: int implements EnumTransform
{
    case Internal = 1;
    case Profile  = 2;

    public function value(): string
    {
        return match ($this) {
            self::Internal => '内部文档',
            self::Profile  => '对外展示',
        };
    }
}
