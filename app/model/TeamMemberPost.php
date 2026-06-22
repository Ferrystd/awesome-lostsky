<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMemberPost 模型
 * @mixin \think\Model
 */
class TeamMemberPost extends Base
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
        'member_id' => 'integer',
        'post_id' => 'integer',
        'type_id' => 'integer',//一定是已经有的类型

    ];

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }

    public function type()
    {
        return $this->belongsTo(TeamMemberPostType::class, 'type_id');
    }
}
