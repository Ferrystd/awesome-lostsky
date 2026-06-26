<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

class TeamSetting extends Base
{
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        'app_name'    => 'string',
        'key'         => 'string',
        'value'       => 'string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];
    protected $hidden = ['delete_time'];
    protected $readonly = ['team_id', 'app_name', 'key'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }
}
