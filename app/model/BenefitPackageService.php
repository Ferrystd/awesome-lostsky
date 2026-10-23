<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * BenefitPackageService 模型
 * @mixin \think\Model
 */
class BenefitPackageService extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'package_id' => 'integer',
        // service_id/product_id 二选一；可空外键不能转换成整数 0。
        'quantity' => 'string',
        'valid_days' => 'integer',
        'unit_price' => 'string',
        'unit_cost' => 'string',
        'unit_handler_cut' => 'string',
        'unit_sender_cut' => 'string',
        'unit_cs_cut' => 'string',
        'sort' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['package_id', 'service_id', 'product_id'];

    public function package() { return $this->belongsTo(BenefitPackage::class, 'package_id'); }
    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
    public function product() { return $this->belongsTo(TeamProduct::class, 'product_id'); }
}
