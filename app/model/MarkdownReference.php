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
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'referenceable_type' => 'string',
        'referenceable_id'   => 'integer',
        'referenceable_field'=> 'string',
        'entity_identity_id' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['referenceable_type', 'referenceable_id', 'referenceable_field', 'entity_identity_id'];

    public function referenceable()
    {
        return $this->morphTo('referenceable', [
            'document'          => Document::class,
            'teamMemberProfile' => TeamMemberProfile::class,
        ]);
    }

    public function entity()
    {
        return $this->belongsTo(EntityIdentity::class, 'entity_identity_id');
    }
}
