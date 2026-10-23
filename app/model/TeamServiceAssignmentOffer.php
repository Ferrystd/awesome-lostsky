<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ServiceAssignmentOfferStatus;

/**
 * TeamServiceAssignmentOffer 模型
 * @mixin \think\Model
 */
class TeamServiceAssignmentOffer extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id' => 'integer',
        'service_id' => 'integer',
        'customer_id' => 'integer',
        'holder_entity_id' => 'integer',
        'entitlement_id' => 'integer',
        'target_handler_entity_id' => 'integer',
        'quantity' => 'string',
        'status' => ServiceAssignmentOfferStatus::class,
        'total_price' => 'string',
        'cost' => 'string',
        'handler_cut' => 'string',
        'sender_cut' => 'string',
        'cs_cut' => 'string',
        'team_cut' => 'string',
        'decided_at' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = ['field_values'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time', 'expire_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = [
        'team_id', 'service_id', 'customer_id', 'holder_entity_id', 'entitlement_id',
        'target_handler_entity_id', 'quantity', 'field_values', 'memo', 'total_price',
        'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'idempotency_key',
    ];

    public function team() { return $this->belongsTo(Team::class, 'team_id'); }
    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
    public function customer() { return $this->belongsTo(TeamCustomer::class, 'customer_id'); }
    public function holder() { return $this->belongsTo(Entity::class, 'holder_entity_id'); }
    public function entitlement() { return $this->belongsTo(TeamServiceEntitlement::class, 'entitlement_id'); }
    public function targetHandler() { return $this->belongsTo(Entity::class, 'target_handler_entity_id'); }
    public function instance() { return $this->belongsTo(TeamServiceInstance::class, 'service_instance_id'); }
    public function decider() { return $this->belongsTo(Entity::class, 'decided_by_entity_id'); }
}
