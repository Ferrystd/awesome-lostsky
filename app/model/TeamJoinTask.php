<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamJoinTask 模型
 * @mixin \think\Model
 */
class TeamJoinTask extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'application_id' => 'integer',
        'title'          => 'string',
        'description'    => 'string',
        'is_passed'      => 'integer',
        'sort'           => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['application_id'];

    public function application()
    {
        return $this->belongsTo(TeamJoinApplication::class, 'application_id');
    }

    public function setTitleAttr($value)
    {
        return trim((string) $value);
    }
}
