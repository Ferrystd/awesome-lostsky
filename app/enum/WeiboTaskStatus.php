<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboTaskStatus: int
{
    case Paused = 1;
    case Active = 2;
    case BlockedLogin = 3;
    case BlockedAbility = 4;
    case Cancelled = 5;
}
