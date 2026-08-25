<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboExecutionStatus: int
{
    case Dispatching = 1;
    case Succeeded = 2;
    case Failed = 3;
    case Unknown = 4;
}
