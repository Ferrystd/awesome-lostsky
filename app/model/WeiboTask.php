<?php
declare(strict_types=1);

namespace app\model;

use app\enum\WeiboOperationType;
use app\enum\WeiboTaskStatus;

final class WeiboTask extends Base
{
    protected $type = [
        'id' => 'integer', 'team_id' => 'integer', 'owner_entity_id' => 'integer',
        'creator_entity_id' => 'integer', 'operation_type' => WeiboOperationType::class,
        'status' => WeiboTaskStatus::class,
        'start_at' => 'integer', 'min_interval' => 'integer', 'max_interval' => 'integer',
        'next_run_at' => 'integer', 'version' => 'integer',
    ];
}
