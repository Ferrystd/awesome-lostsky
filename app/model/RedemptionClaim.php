<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * RedemptionClaim 模型
 * @mixin \think\Model
 */
class RedemptionClaim extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'campaign_id' => 'integer',
        'code_id' => 'integer',
        'claim_key' => 'string',
        'claimed_by_entity_id' => 'integer',
        'claimed_at' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['campaign_id', 'code_id', 'claim_key', 'target_team_id', 'target_entity_id', 'claimed_by_entity_id', 'claimed_at'];

    public function campaign() { return $this->belongsTo(RedemptionCampaign::class, 'campaign_id'); }
    public function code() { return $this->belongsTo(RedemptionCode::class, 'code_id'); }
    public function targetTeam() { return $this->belongsTo(Team::class, 'target_team_id'); }
    public function targetEntity() { return $this->belongsTo(Entity::class, 'target_entity_id'); }
}
