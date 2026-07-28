<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ChatDeliveryStatus;

class ChatWebhookDelivery extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'        => 'integer',
        'outbox_id'      => 'integer',
        'integration_id' => 'integer',
        'status'         => ChatDeliveryStatus::class,
        'attempts'       => 'integer',
        'available_at'   => 'integer',
        'processing_until' => 'integer',
        // 'delivered_at'  => 'null|integer',
        // 'response_code' => 'null|integer',
    ];

    protected $json = [];
    protected $hidden = ['delete_time', 'processing_token', 'processing_until'];
    protected $append = [];
    protected $readonly = ['team_id', 'outbox_id', 'integration_id'];

    public function outbox()
    {
        return $this->belongsTo(ChatEventOutbox::class, 'outbox_id');
    }

    public function integration()
    {
        return $this->belongsTo(TeamVirtualIntegration::class, 'integration_id');
    }
}
