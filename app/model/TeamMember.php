<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMember 模型
 * @mixin \think\Model
 */
class TeamMember extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        //固定字段

        //拓展字段 
        'team_id' => 'integer',
        'user_id' => 'integer',
        'is_displayed' => 'integer',
        'is_blocked' => 'integer',//是否被管理员封禁，0正常，1封禁
    ];

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamMemberProfile::class, 'member_id')
            ->bind(['nickname', 'avatar']);
    }

    public function posts()
    {
        return $this->hasMany(TeamMemberPost::class, 'member_id');
    }
}
