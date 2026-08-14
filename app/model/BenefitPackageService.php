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
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'package_id' => 'integer',
        'service_id' => 'integer',
        'quantity' => 'string',
        'valid_days' => 'integer',
        'unit_price' => 'string',
        'unit_cost' => 'string',
        'unit_handler_cut' => 'string',
        'unit_sender_cut' => 'string',
        'unit_cs_cut' => 'string',
        'sort' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['package_id', 'service_id'];

    public function package() { return $this->belongsTo(BenefitPackage::class, 'package_id'); }
    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
}
