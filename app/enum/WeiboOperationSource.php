<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboOperationSource: int
{
    case Manual = 1;
    case Schedule = 2;
}
