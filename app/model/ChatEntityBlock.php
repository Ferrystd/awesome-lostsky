<?php
declare(strict_types=1);

namespace app\model;

class ChatEntityBlock extends Base
{
    protected $type = [
        'id' => 'integer',
        'blocker_entity_id' => 'integer',
        'blocked_entity_id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['blocker_entity_id', 'blocked_entity_id'];
}
