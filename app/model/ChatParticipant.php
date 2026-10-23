<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ChatParticipantStatus;

class ChatParticipant extends Base
{
    use concern\BelongsToEntity;

    protected $type = [
        'team_id'              => 'integer',
        'conversation_id'      => 'integer',
        'entity_id'            => 'integer',
        'status'               => ChatParticipantStatus::class,
        'invited_by_entity_id' => 'integer',
        'joined_at'            => 'integer',
        // 'left_at'              => 'null|integer',
        // 'last_read_message_id' => 'null|integer',
    ] + self::COMMON_TYPES;

    protected $json = [];
    protected $append = [];
    protected $readonly = ['team_id', 'conversation_id', 'entity_id'];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

}
