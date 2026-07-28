<?php
declare(strict_types=1);

namespace app\enum;

enum ChatActorType: string
{
    case Entity = 'entity';
    case Customer = 'customer';
    case Team = 'team';
    case Virtual = 'virtual';
}
