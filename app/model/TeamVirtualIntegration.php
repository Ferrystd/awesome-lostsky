<?php
declare (strict_types = 1);

namespace app\model;

class TeamVirtualIntegration extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'     => 'integer',
        'virtual_id'  => 'integer',
        'name'        => 'string',
        'driver'      => 'string',
        'is_active'   => 'integer',
    ];

    protected $json = ['events'];
    protected $hidden = ['delete_time', 'token_hash', 'signing_secret'];
    protected $append = [];
    protected $readonly = ['team_id', 'virtual_id', 'driver'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function virtual()
    {
        return $this->belongsTo(TeamVirtual::class, 'virtual_id');
    }

    public function deliveries()
    {
        return $this->hasMany(ChatWebhookDelivery::class, 'integration_id');
    }
}
