<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\ServiceStatus;

/**
 * TeamServiceInstance 模型
 * @mixin \think\Model
 */
class TeamServiceInstance extends Base
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
        'service_id' => 'integer',
        'customer_id' => 'integer',
        'holder_entity_id' => 'integer',
        'entitlement_id' => 'integer',
        'ordinal' => 'integer',
        'quantity' => 'string',
        'status' => ServiceStatus::class,
        'total_price' => 'string',
        'cost' => 'string',
        'handler_cut' => 'string',
        'sender_cut' => 'string',
        'cs_cut' => 'string',
        'team_cut' => 'string',
        'expire_time' => 'integer',
        'memo' => 'string',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = ['is_expired'];

    /** 只读字段 */
    protected $readonly = [
        'team_id', 'service_id', 'customer_id', 'holder_entity_id', 'entitlement_id',
        'source_product_id', 'source_order_id', 'source_claim_id', 'ordinal', 'quantity',
        'sender_entity_id', 'cs_entity_id', 'expire_time',
    ];

    public function getIsExpiredAttr(): bool
    {
        return $this->enumCase('status') === ServiceStatus::Unredeemed
            && (int) $this->expire_time > 0
            && (int) $this->expire_time < time();
    }

    public function team() { return $this->belongsTo(Team::class, 'team_id'); }
    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
    public function entitlement() { return $this->belongsTo(TeamServiceEntitlement::class, 'entitlement_id'); }
    public function sourceProduct() { return $this->belongsTo(TeamProduct::class, 'source_product_id'); }
    public function customer() { return $this->belongsTo(TeamCustomer::class, 'customer_id'); }
    public function holder() { return $this->belongsTo(Entity::class, 'holder_entity_id'); }
    public function handler() { return $this->belongsTo(Entity::class, 'handler_entity_id'); }
    public function sender() { return $this->belongsTo(Entity::class, 'sender_entity_id'); }
    public function cs() { return $this->belongsTo(Entity::class, 'cs_entity_id'); }
    public function cancelRequests() { return $this->hasMany(TeamServiceCancelRequest::class, 'service_instance_id'); }
    public function events() { return $this->hasMany(TeamServiceEvent::class, 'service_instance_id'); }
    public function fieldValues() { return $this->hasMany(TeamServiceFieldValue::class, 'service_instance_id'); }
    public function adjustments() { return $this->hasMany(TeamServiceAdjustment::class, 'service_instance_id'); }
}
