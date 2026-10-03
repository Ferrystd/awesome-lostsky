<?php
declare(strict_types=1);

namespace app\enum;

enum ChatParticipantStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Rejected = 'rejected';
}
