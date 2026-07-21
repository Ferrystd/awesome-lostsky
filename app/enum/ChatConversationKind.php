<?php
declare(strict_types=1);

namespace app\enum;

enum ChatConversationKind: string
{
    case Direct = 'direct';
    case Group = 'group';
}
