<?php
declare (strict_types = 1);

namespace app\model;

class ChatMessage extends Base
{
    use concern\BelongsToEntity;

    protected $type = [
        'team_id'               => 'integer',
        'conversation_id'       => 'integer',
        'entity_id'             => 'integer',
        // 'reply_id'              => 'null|integer',
        // 'origin_integration_id' => 'null|integer',
        // 'edited_at'             => 'null|integer',
        // 'revoked_at'            => 'null|integer',
    ] + self::COMMON_TYPES;

    protected $json = [];
    protected $append = [];
    protected $readonly = ['team_id', 'conversation_id', 'entity_id', 'reply_id', 'origin_integration_id'];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function reply()
    {
        return $this->belongsTo(self::class, 'reply_id');
    }
}
