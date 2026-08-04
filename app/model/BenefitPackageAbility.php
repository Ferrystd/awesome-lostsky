<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * BenefitPackageAbility 模型
 * @mixin \think\Model
 */
class BenefitPackageAbility extends Base
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
        'ability_key' => 'string',
        'level' => 'integer',
        'duration_days' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['package_id', 'ability_key'];

    public function package() { return $this->belongsTo(BenefitPackage::class, 'package_id'); }
}
