<?php
declare (strict_types = 1);

namespace app\model;

class TeamVirtualIntegration extends Base
{
    use concern\BelongsToTeam;

    protected $type = [
        'team_id'     => 'integer',
        'virtual_id'  => 'integer',
        'name'        => 'string',
        'driver'      => 'string',
        'is_active'   => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = ['events'];
    protected $hidden = ['delete_time', 'token_hash', 'signing_secret'];
    protected $append = [];
    protected $readonly = ['team_id', 'virtual_id', 'driver'];

    public function virtual()
    {
        return $this->belongsTo(TeamVirtual::class, 'virtual_id');
    }

    public function deliveries()
    {
        return $this->hasMany(ChatWebhookDelivery::class, 'integration_id');
    }
}
