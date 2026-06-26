<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMemberProfile 模型
 * @mixin \think\Model
 */
class TeamMemberProfile extends Base
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
        'member_id'             => 'integer',
        'nickname'              => 'string',
        'avatar'                => 'string',
        'intro_image'           => 'string',
        'intro_video'           => 'string',
        'introduction_markdown' => 'string',
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
}
