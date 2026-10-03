<?php
declare(strict_types=1);

namespace app\model;

use app\enum\WeiboExecutionStatus;
use app\enum\WeiboOperationSource;
use app\enum\WeiboOperationType;
use app\enum\WeiboReason;

final class WeiboOperationLog extends Base
{
    protected $enumReadName = false;
    protected $type = [
        'id' => 'integer', 'team_id' => 'integer', 'owner_entity_id' => 'integer',
        'actor_entity_id' => 'integer', 'account_id' => 'integer', 'task_id' => 'integer',
        'task_version' => 'integer', 'operation_type' => WeiboOperationType::class,
        'source' => WeiboOperationSource::class, 'status' => WeiboExecutionStatus::class,
        'reason' => WeiboReason::class, 'http_status' => 'integer',
        'media_summary' => 'json', 'started_at' => 'integer', 'finished_at' => 'integer',
    ];
    protected $json = ['media_summary'];
    protected $hidden = ['delete_time'];
}
