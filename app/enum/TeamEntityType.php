<?php
declare(strict_types=1);

namespace app\enum;

enum TeamEntityType: string
{
    case Entity = 'entity';
    case Customer = 'customer';
    case Virtual = 'virtual';
}
