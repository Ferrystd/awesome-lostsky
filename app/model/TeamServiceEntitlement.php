<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\service\ServiceQuantity;

/**
 * TeamServiceEntitlement 模型
 * @mixin \think\Model
 */
class TeamServiceEntitlement extends Base
{
    use concern\BelongsToTeam;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id' => 'integer',
        'service_id' => 'integer',
        'customer_id' => 'integer',
        'holder_entity_id' => 'integer',
        'ordinal' => 'integer',
        'unit_name' => 'string',
        'quantity_step' => 'string',
        'granted_quantity' => 'string',
        'reserved_quantity' => 'string',
        'consumed_quantity' => 'string',
        'total_price' => 'string',
        'cost' => 'string',
        'handler_cut' => 'string',
        'sender_cut' => 'string',
        'cs_cut' => 'string',
        'team_cut' => 'string',
        'expire_time' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = ['available_quantity', 'is_expired', 'is_exhausted'];

    /** 只读字段 */
    protected $readonly = [
        'team_id', 'service_id', 'customer_id', 'holder_entity_id', 'sender_entity_id', 'cs_entity_id', 'source_product_id',
        'source_order_id', 'source_claim_id', 'source_package_item_id', 'ordinal',
        'unit_name', 'quantity_step', 'granted_quantity', 'total_price',
        'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'expire_time',
        'unused_auto_complete_after_minutes', 'unused_auto_complete_due_at',
    ];

    public function getAvailableQuantityAttr(): string
    {
        $quantity = app(ServiceQuantity::class);
        return $quantity->fromMinor(
            $quantity->toMinor($this->granted_quantity)
            - $quantity->toMinor($this->reserved_quantity)
            - $quantity->toMinor($this->consumed_quantity)
        );
    }

    public function getIsExpiredAttr(): bool
    {
        return (int) $this->expire_time > 0 && (int) $this->expire_time < time();
    }

    public function getIsExhaustedAttr(): bool
    {
        return app(ServiceQuantity::class)->toMinor($this->available_quantity) === 0;
    }

    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
    public function customer() { return $this->belongsTo(TeamCustomer::class, 'customer_id'); }
    public function holder() { return $this->belongsTo(Entity::class, 'holder_entity_id'); }
    public function sender() { return $this->belongsTo(Entity::class, 'sender_entity_id'); }
    public function cs() { return $this->belongsTo(Entity::class, 'cs_entity_id'); }
    public function sourceProduct() { return $this->belongsTo(TeamProduct::class, 'source_product_id'); }
    public function sourceOrder() { return $this->belongsTo(TeamOrder::class, 'source_order_id'); }
    public function sourceClaim() { return $this->belongsTo(RedemptionClaim::class, 'source_claim_id'); }
    public function sourcePackageItem() { return $this->belongsTo(BenefitPackageService::class, 'source_package_item_id'); }
    public function instances() { return $this->hasMany(TeamServiceInstance::class, 'entitlement_id'); }
    public function assignmentOffers() { return $this->hasMany(TeamServiceAssignmentOffer::class, 'entitlement_id'); }
}
