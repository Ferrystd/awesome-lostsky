<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ChatConversationKind;

class ChatConversation extends Base
{
    protected $type = [
        'team_id'         => 'integer',
        'uuid'            => 'string',
        'kind'            => ChatConversationKind::class,
        'is_temporary'    => 'integer',
        'entity_id'       => 'integer',
        // 'last_message_id' => 'null|integer',
        // 'last_message_at' => 'null|integer',
        // 'expires_at'      => 'null|integer',
        // 'closed_at'       => 'null|integer',
    ] + self::COMMON_TYPES;

    protected $json = [];
    protected $append = ['is_closed'];
    protected $readonly = ['team_id', 'uuid', 'kind', 'is_temporary', 'entity_id', 'direct_key'];

    public function getIsClosedAttr($value, $data): bool
    {
        return !empty($data['closed_at']) || (!empty($data['expires_at']) && (int) $data['expires_at'] <= time());
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    public function participants()
    {
        return $this->hasMany(ChatParticipant::class, 'conversation_id');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    public function lastMessage()
    {
        return $this->belongsTo(ChatMessage::class, 'last_message_id');
    }
}
