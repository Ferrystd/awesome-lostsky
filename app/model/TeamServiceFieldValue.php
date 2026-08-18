<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamServiceFieldValue 模型
 * @mixin \think\Model
 */
class TeamServiceFieldValue extends Base
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
        'service_instance_id' => 'integer',
        'field_id' => 'integer',
        'resource_index' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = ['value_json'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['service_instance_id', 'field_id', 'resource_index'];

    public function instance() { return $this->belongsTo(TeamServiceInstance::class, 'service_instance_id'); }
    public function field() { return $this->belongsTo(TeamServiceRedemptionField::class, 'field_id'); }
}
