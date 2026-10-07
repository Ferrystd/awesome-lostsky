<?php
declare(strict_types=1);
namespace app\enum;
enum CommunityContentStatus: int
{
    case Visible = 1;
    case Deleted = 2;
    case Hidden = 3;
}
