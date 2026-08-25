<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboAccountHealth: int
{
    case Unchecked = 0;
    case Valid = 1;
    case Invalid = 2;
    case Unknown = 3;
}
