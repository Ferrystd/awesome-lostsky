<?php
declare(strict_types=1);

namespace app\model;

class ChatConversationAlias extends Base
{
    protected $type = [
        'conversation_id' => 'integer',
    ] + self::COMMON_TYPES;
    protected $readonly = ['alias_uuid', 'conversation_id'];
}
