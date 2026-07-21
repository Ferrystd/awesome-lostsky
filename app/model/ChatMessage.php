<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ChatActorType;

class ChatMessage extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'               => 'integer',
        'conversation_id'       => 'integer',
        'sender_type'           => ChatActorType::class,
        'sender_id'             => 'integer',
        // 'reply_id'              => 'null|integer',
        // 'origin_integration_id' => 'null|integer',
        // 'edited_at'             => 'null|integer',
        // 'revoked_at'            => 'null|integer',
    ];

    protected $json = [];
    protected $hidden = ['delete_time'];
    protected $append = [];
    protected $readonly = ['team_id', 'conversation_id', 'sender_type', 'sender_id', 'reply_id', 'origin_integration_id'];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->morphTo('sender', [
            'member' => TeamMember::class,
            'customer' => TeamCustomer::class,
            'virtual' => TeamVirtual::class,
        ]);
    }

    public function reply()
    {
        return $this->belongsTo(self::class, 'reply_id');
    }
}
