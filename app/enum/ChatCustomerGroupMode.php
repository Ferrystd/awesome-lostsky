<?php
declare(strict_types=1);

namespace app\enum;

enum ChatCustomerGroupMode: string
{
    case Disabled = 'disabled';
    case InviteOnly = 'invite_only';
    case Create = 'create';
}
