<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\RedemptionMode;

/**
 * RedemptionCampaign 模型
 * @mixin \think\Model
 */
class RedemptionCampaign extends Base
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
        'package_id' => 'integer',
        'name' => 'string',
        'claim_group' => 'string',
        'mode' => 'integer',
        'redeem_starts_at' => 'integer',
        'redeem_ends_at' => 'integer',
        'is_active' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['package_id', 'issuer_team_id', 'owner_entity_id', 'claim_group', 'mode'];

    public function package() { return $this->belongsTo(BenefitPackage::class, 'package_id'); }
    public function issuer() { return $this->belongsTo(Team::class, 'issuer_team_id'); }
    public function owner() { return $this->belongsTo(Entity::class, 'owner_entity_id'); }
    public function codes() { return $this->hasMany(RedemptionCode::class, 'campaign_id'); }
    public function claims() { return $this->hasMany(RedemptionClaim::class, 'campaign_id'); }
}
