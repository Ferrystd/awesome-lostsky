<?php
declare(strict_types=1);

namespace app\model;

class ChatConversationAlias extends Base
{
    protected $type = [
        'id' => 'integer',
        'conversation_id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $readonly = ['alias_uuid', 'conversation_id'];
    protected $hidden = ['delete_time'];
}
