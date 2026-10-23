<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\BenefitPricingMode;
use app\model\Base;

/**
 * BenefitPackage 模型
 * @mixin \think\Model
 */
class BenefitPackage extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'name' => 'string',
        'pricing_mode' => BenefitPricingMode::class,
        'is_active' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['issuer_team_id', 'owner_entity_id'];

    public function issuer() { return $this->belongsTo(Team::class, 'issuer_team_id'); }
    public function owner() { return $this->belongsTo(Entity::class, 'owner_entity_id'); }
    public function abilities() { return $this->hasMany(BenefitPackageAbility::class, 'package_id'); }
    public function services() { return $this->hasMany(BenefitPackageService::class, 'package_id'); }
}
