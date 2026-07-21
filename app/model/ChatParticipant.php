<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ChatActorType;

class ChatParticipant extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'              => 'integer',
        'conversation_id'      => 'integer',
        'actor_type'           => ChatActorType::class,
        'actor_id'             => 'integer',
        'joined_at'            => 'integer',
        // 'left_at'              => 'null|integer',
        // 'last_read_message_id' => 'null|integer',
    ];

    protected $json = [];
    protected $hidden = ['delete_time'];
    protected $append = [];
    protected $readonly = ['team_id', 'conversation_id', 'actor_type', 'actor_id'];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function actor()
    {
        return $this->morphTo('actor', [
            'member' => TeamMember::class,
            'customer' => TeamCustomer::class,
            'virtual' => TeamVirtual::class,
        ]);
    }
}
