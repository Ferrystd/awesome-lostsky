<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

class File extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'size'        => 'integer',
        // team_id 允许为 NULL(system file)，不能声明 integer，否则 NULL 会被转换为 0
        // 'team_id'     => 'integer|null',
        // member_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // 'member_id'   => 'integer|null',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $readonly = ['hash', 'team_id', 'member_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }
}
