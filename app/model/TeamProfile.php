<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamProfile 模型
 * @mixin \think\Model
 */
class TeamProfile extends Base
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
        'title' => 'string',
        'description' => 'string',
        'introduction' => 'string',
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
}
