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
        'id'               => 'integer',
        'visibleable_type' => 'string',
        'visibleable_id'   => 'integer',
        'target_type'      => 'string',
        'target_id'        => 'integer',
        'create_time'      => 'integer',
        'update_time'      => 'integer',
        'delete_time'      => 'integer',

    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['visibleable_type', 'visibleable_id', 'target_type', 'target_id'];

    public function visibleable()
    {
        return $this->morphTo('visibleable', [
            'document'        => Document::class,
            'teamSetting'     => TeamSetting::class,
            'teamMemberField' => TeamMemberField::class,
        ]);
    }

    public function target()
    {
        return $this->morphTo('target', [
            'team'       => Team::class,
            'teamMember' => TeamMember::class,
        ]);
    }
}
