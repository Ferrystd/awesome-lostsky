<?php
declare(strict_types=1);

namespace app\enum;

enum ChatActorType: string
{
    case Member = 'member';
    case Customer = 'customer';
    case Virtual = 'virtual';
}
