<?php
declare(strict_types=1);

namespace app\enum;

enum ChatDeliveryStatus: string
{
    case Pending = 'pending';
    case Delivered = 'delivered';
    case Failed = 'failed';
}
