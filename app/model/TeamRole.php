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
        // 角色对外展示：仅决定该角色标签是否出现在公开资料中；
        // 不控制实体的公开 Display、团队内目录可见性或任何权限判定。
        'is_displayed'=> 'integer',
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

    public function entityRoles()
    {
        return $this->hasMany(TeamEntityRole::class, 'role_id');
    }
}
