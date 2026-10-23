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
    use concern\BelongsToTeam;

    protected $type = [
        'team_id'        => 'integer',
        'role_id'        => 'integer',
        'permission_key' => 'string',
    ] + self::COMMON_TYPES;

    protected $json = [];


    protected $append = [];

    protected $readonly = ['team_id', 'role_id', 'permission_key'];

    public function role()
    {
        return $this->belongsTo(TeamRole::class, 'role_id');
    }
}
