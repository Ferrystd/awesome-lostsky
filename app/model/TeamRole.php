<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamRole 模型
 * @mixin \think\Model
 */
class TeamRole extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'team_id'     => 'integer',
        'role_key'    => 'string',
        'name'        => 'string',
        'description' => 'string',
        'sort'        => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function permissions()
    {
        return $this->hasMany(TeamRolePermission::class, 'role_id');
    }

    public function memberRoles()
    {
        return $this->hasMany(TeamMemberRole::class, 'role_id');
    }
}
