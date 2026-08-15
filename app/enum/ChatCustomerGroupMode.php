<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ChatCustomerGroupMode: string implements EnumTransform
{
    case Disabled = 'disabled';
    case InviteOnly = 'invite_only';
    case Create = 'create';

    public function value(): string
    {
        return match ($this) {
            self::Disabled   => '禁止顾客加入',
            self::InviteOnly => '仅限团队邀请',
            self::Create     => '允许顾客创建',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Disabled   => '顾客不能创建群聊，也不能被邀请进入群聊。',
            self::InviteOnly => '顾客不能创建群聊，只能由团队成员邀请进入。',
            self::Create     => '顾客可以创建群聊，但不能主动邀请其他顾客。',
        };
    }
}
