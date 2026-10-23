<?php
declare(strict_types=1);

namespace app\model;

class ChatEntityBlock extends Base
{
    protected $type = [
        'blocker_entity_id' => 'integer',
        'blocked_entity_id' => 'integer',
    ] + self::COMMON_TYPES;
    protected $readonly = ['blocker_entity_id', 'blocked_entity_id'];
}
