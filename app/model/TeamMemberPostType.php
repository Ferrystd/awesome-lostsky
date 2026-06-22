<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMemberPostType 模型
 * @mixin \think\Model
 */
class TeamMemberPostType extends Base
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
        'name' => 'string',
        'description' => 'string',
        'team_id' => 'integer',
        'post_id' => 'integer',//在team内唯一，全局不唯一
        'sort' => 'integer',//排序
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

    public function posts()
    {
        return $this->hasMany(TeamMemberPost::class, 'type_id');
    }
}
