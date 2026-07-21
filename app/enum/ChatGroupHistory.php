<?php
declare(strict_types=1);

namespace app\enum;

enum ChatGroupHistory: string
{
    case FromJoin = 'from_join';
    case All = 'all';
}
