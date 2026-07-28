<?php
declare (strict_types = 1);

namespace app\model;

class ChatEventOutbox extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'      => 'integer',
        'attempts'     => 'integer',
        'available_at' => 'integer',
        'processing_until' => 'integer',
        // 'published_at' => 'null|integer',
    ];

    protected $json = ['payload'];
    protected $hidden = ['delete_time', 'processing_token', 'processing_until'];
    protected $append = [];
    protected $readonly = ['team_id', 'event_type', 'aggregate_type', 'aggregate_id', 'payload'];

    public function deliveries()
    {
        return $this->hasMany(ChatWebhookDelivery::class, 'outbox_id');
    }
}
