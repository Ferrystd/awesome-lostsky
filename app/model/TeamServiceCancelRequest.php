<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\ServiceCancelStatus;

/**
 * TeamServiceCancelRequest 模型
 * @mixin \think\Model
 */
class TeamServiceCancelRequest extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'service_instance_id' => 'integer',
        'requested_by_entity_id' => 'integer',
        'status' => ServiceCancelStatus::class,
        'reason' => 'string',
        'decision_reason' => 'string',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['service_instance_id', 'requested_by_entity_id', 'reason'];

    public function instance() { return $this->belongsTo(TeamServiceInstance::class, 'service_instance_id'); }
    public function requester() { return $this->belongsTo(Entity::class, 'requested_by_entity_id'); }
    public function decider() { return $this->belongsTo(Entity::class, 'decided_by_entity_id'); }
}
