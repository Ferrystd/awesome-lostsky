<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * MarkdownReference 模型
 * @mixin \think\Model
 */
class MarkdownReference extends Base
{
    use concern\BelongsToEntity;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'referenceable_type' => 'string',
        'referenceable_id'   => 'integer',
        'referenceable_field'=> 'string',
        'entity_id' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['referenceable_type', 'referenceable_id', 'referenceable_field', 'entity_id'];

    public function referenceable()
    {
        return $this->morphTo('referenceable', [
            'document'          => Document::class,
            'communityPost' => CommunityPost::class,
            'communityComment' => CommunityComment::class,
            'communityAnnouncement' => CommunityAnnouncement::class,
            'teamEntityProfile' => TeamEntityProfile::class,
            'teamProduct'       => TeamProduct::class,
        ]);
    }

}
