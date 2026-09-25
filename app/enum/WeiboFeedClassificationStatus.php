<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboFeedClassificationStatus: int
{
    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
    case Failed = 4;
}
