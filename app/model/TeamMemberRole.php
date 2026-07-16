<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMemberRole 模型
 * @mixin \think\Model
 */
class TeamMemberRole extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'team_id'   => 'integer',
        'member_id' => 'integer',
        'role_id'   => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id', 'member_id', 'role_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }

    public function role()
    {
        return $this->belongsTo(TeamRole::class, 'role_id');
    }
}
