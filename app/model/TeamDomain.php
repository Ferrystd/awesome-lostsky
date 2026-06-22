<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamDomain 模型 — 自定义域名绑定
 * @mixin \think\Model
 */
class TeamDomain extends Base
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
        'domain' => 'string',
        'app' => 'string',

        //team可以用自己的前后端域名

        //
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
