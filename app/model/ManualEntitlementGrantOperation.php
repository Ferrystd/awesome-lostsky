<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * ManualEntitlementGrantOperation 模型
 * @mixin \think\Model
 */
class ManualEntitlementGrantOperation extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'team_id' => 'integer',
        'actor_entity_id' => 'integer',
        'idempotency_key' => 'string',
        'request_hash' => 'string',

    ];

    /** JSON 字段 */
    protected $json = ['result'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'actor_entity_id', 'idempotency_key', 'request_hash'];

    // 成功账本永久保留；不提供软删除语义。
    protected $deleteTime = false;
}
