<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ServiceAdjustmentStatus;
use app\model\Base;

/**
 * TeamServiceAdjustment 模型
 * @mixin \think\Model
 */
class TeamServiceAdjustment extends Base
{
    use concern\BelongsToTeam;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id' => 'integer',
        'service_instance_id' => 'integer',
        'customer_id' => 'integer',
        'requested_by_entity_id' => 'integer',
        'name' => 'string',
        'quantity' => 'string',
        'unit_price' => 'string',
        'total_price' => 'string',
        'cost' => 'string',
        'handler_cut' => 'string',
        'sender_cut' => 'string',
        'cs_cut' => 'string',
        'team_cut' => 'string',
        'status' => ServiceAdjustmentStatus::class,
        'memo' => 'string',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = [
        'team_id', 'service_instance_id', 'customer_id', 'requested_by_entity_id',
        'name', 'quantity', 'unit_price', 'total_price', 'cost', 'handler_cut',
        'sender_cut', 'cs_cut', 'team_cut',
    ];

    public function instance() { return $this->belongsTo(TeamServiceInstance::class, 'service_instance_id'); }
    public function customer() { return $this->belongsTo(TeamCustomer::class, 'customer_id'); }
    public function requester() { return $this->belongsTo(Entity::class, 'requested_by_entity_id'); }
    public function decider() { return $this->belongsTo(Entity::class, 'decided_by_entity_id'); }
    public function receiptTransaction() { return $this->belongsTo(TeamTransaction::class, 'receipt_trans_id'); }
    public function performanceTransaction() { return $this->belongsTo(TeamTransaction::class, 'performance_trans_id'); }
}
