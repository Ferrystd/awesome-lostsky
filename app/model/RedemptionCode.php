<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * RedemptionCode 模型
 * @mixin \think\Model
 */
class RedemptionCode extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'campaign_id' => 'integer',
        'ordinal' => 'integer',
        'code_hint' => 'string',
        'code_hash' => 'string',
        'code_ciphertext' => 'string',
        'use_count' => 'integer',
        'expire_time' => 'integer',
        'is_active' => 'integer',
        'fulfillment_snapshot' => 'array',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = ['fulfillment_snapshot'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time', 'code_hash', 'code_ciphertext', 'fulfillment_snapshot', 'source_claim_id'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['campaign_id', 'source_order_id', 'source_claim_id', 'fulfillment_snapshot', 'ordinal', 'holder_entity_id', 'target_team_id', 'target_entity_id', 'code_hash'];

    public function campaign() { return $this->belongsTo(RedemptionCampaign::class, 'campaign_id'); }
    public function sourceOrder() { return $this->belongsTo(TeamOrder::class, 'source_order_id'); }
    public function holder() { return $this->belongsTo(Entity::class, 'holder_entity_id'); }
    public function claims() { return $this->hasMany(RedemptionClaim::class, 'code_id'); }
}
