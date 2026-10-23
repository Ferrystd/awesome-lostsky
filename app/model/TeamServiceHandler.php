<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamServiceHandler 模型
 * @mixin \think\Model
 */
class TeamServiceHandler extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'service_id' => 'integer',
        'entity_id' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['service_id', 'entity_id'];

    public function service() { return $this->belongsTo(TeamService::class, 'service_id'); }
    public function subject() { return $this->belongsTo(Entity::class, 'entity_id'); }
}
