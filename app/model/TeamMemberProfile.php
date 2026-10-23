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
        //固定字段

        //拓展字段
        'entity_id'             => 'integer',
        'nickname'              => 'string',
        'avatar'                => 'string',//头像
        'description'           => 'string',
        'intro_image'           => 'string',//自介图
        'intro_video'           => 'string',//音介视频
        'introduction_markdown' => 'string',//个人简介（Markdown格式）
    ] + self::COMMON_TYPES;

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    public function markdownReferences()
    {
        return $this->morphMany(MarkdownReference::class, 'referenceable', 'teamMemberProfile');
    }
}
