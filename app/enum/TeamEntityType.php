<?php
declare(strict_types=1);

namespace app\enum;

enum TeamEntityType: string
{
    case Member = 'member';
    case Customer = 'customer';
    case Virtual = 'virtual';
}
