<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamServiceEvent 模型
 * @mixin \think\Model
 */
class TeamServiceEvent extends Base
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
        'service_instance_id' => 'integer',
        'event_type' => 'string',
    ];

    /** JSON 字段 */
    protected $json = ['detail'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['service_instance_id', 'actor_entity_id', 'event_type'];

    public function instance() { return $this->belongsTo(TeamServiceInstance::class, 'service_instance_id'); }
    public function actor() { return $this->belongsTo(Entity::class, 'actor_entity_id'); }
}
