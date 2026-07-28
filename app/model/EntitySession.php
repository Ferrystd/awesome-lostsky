<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * EntitySession 模型
 * @mixin \think\Model
 */
class EntitySession extends Base
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $name = 'entity_session';

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id' => 'integer', 'user_id' => 'integer', 'device_token' => 'string', 'jti' => 'string',
        'parent_session_id' => 'integer', 'entity_id' => 'integer',
        'expires_at' => 'integer', 'superseded_at' => 'integer', 'revoked_at' => 'integer',
        'create_time' => 'integer', 'update_time' => 'integer', 'delete_time' => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time', 'jti'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = [
        'user_id', 'device_token', 'jti', 'parent_session_id',
        'entity_id', 'expires_at',
    ];

    public function user() { return $this->belongsTo(User::class, 'user_id'); }
    public function parent() { return $this->belongsTo(self::class, 'parent_session_id'); }
    public function children() { return $this->hasMany(self::class, 'parent_session_id'); }
    public function subject() { return $this->belongsTo(Entity::class, 'entity_id'); }
}
