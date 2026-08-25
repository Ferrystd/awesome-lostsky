<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboOperationType: int
{
    case Post = 1;
    case Like = 2;
    case Comment = 3;
    case Checkin = 4;
}
