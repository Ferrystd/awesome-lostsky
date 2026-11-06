<?php
declare(strict_types=1);
namespace app\enum;
enum CommunityStatus: int
{
    case Active = 1;
    case Paused = 2;
}
