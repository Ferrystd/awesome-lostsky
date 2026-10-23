<?php
declare (strict_types = 1);

namespace app\model;

/**
 * TeamServiceRedemptionField 模型
 * @mixin \think\Model
 */
class TeamServiceRedemptionField extends Base
{
    /** @var array */
    protected $type = [
        'team_id' => 'integer',
        'service_id' => 'integer',
        'name' => 'string',
        'value_type' => 'string',
        'input_type' => 'string',
        'fill_stage' => 'string',
        'is_customer_visible' => 'integer',
        'is_required' => 'integer',
        'is_active' => 'integer',
        'sort' => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = ['options'];
    protected $append = [];
    protected $readonly = ['team_id', 'service_id'];

    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
    public function values() { return $this->hasMany(TeamServiceFieldValue::class, 'field_id'); }
}
