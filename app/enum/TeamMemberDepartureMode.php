<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum TeamMemberDepartureMode: string implements EnumTransform
{
    case Disabled = 'disabled';
    case Review = 'review';
    case Auto = 'auto';

    public function value(): string
    {
        return match ($this) {
            self::Disabled => '不允许成员申请',
            self::Review => '需要审核',
            self::Auto => '自动批准',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Disabled => '成员无法自助发起离队，管理员仍可代提。',
            self::Review => '成员提交后由具备移出权限的实体审核。',
            self::Auto => '成员提交后立即完成离队。',
        };
    }
}
