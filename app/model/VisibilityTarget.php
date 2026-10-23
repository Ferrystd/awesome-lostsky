<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * VisibilityTarget 模型
 * @mixin \think\Model
 */
class VisibilityTarget extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'visibleable_type' => 'string',
        'visibleable_id'   => 'integer',
        'entity_id'        => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['visibleable_type', 'visibleable_id', 'entity_id'];

    public function visibleable()
    {
        return $this->morphTo('visibleable', [
            'document'        => Document::class,
            'teamSetting'     => TeamSetting::class,
            'entityField'     => TeamEntityField::class,
        ]);
    }

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

}
