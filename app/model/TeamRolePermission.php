<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamRolePermission 模型
 * @mixin \think\Model
 */
class TeamRolePermission extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'team_id'        => 'integer',
        'role_id'        => 'integer',
        'permission_key' => 'string',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id', 'role_id', 'permission_key'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function role()
    {
        return $this->belongsTo(TeamRole::class, 'role_id');
    }
}
