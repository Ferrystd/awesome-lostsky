<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamProductRedemptionField 模型
 * @mixin \think\Model
 */
class TeamProductRedemptionField extends Base
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
        'team_id' => 'integer',
        'product_id' => 'integer',
        'field_key' => 'string',
        'name' => 'string',
        'value_type' => 'string',
        'input_type' => 'string',
        'fill_stage' => 'string',
        'is_customer_visible' => 'integer',
        'is_required' => 'integer',
        'is_active' => 'integer',
        'sort' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = ['options'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'product_id', 'field_key'];

    public function product() { return $this->belongsTo(TeamProduct::class, 'product_id'); }
    public function values() { return $this->hasMany(TeamServiceFieldValue::class, 'field_id'); }
}
