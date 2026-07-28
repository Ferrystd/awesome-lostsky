<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ChatGroupHistory: string implements EnumTransform
{
    case FromJoin = 'from_join';
    case All = 'all';

    public function value(): string
    {
        return match ($this) {
            self::FromJoin => '仅加入后消息',
            self::All      => '全部历史消息',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FromJoin => '新参与者只能查看加入群聊之后的消息。',
            self::All      => '新参与者可以查看加入前的全部群聊消息。',
        };
    }
}
