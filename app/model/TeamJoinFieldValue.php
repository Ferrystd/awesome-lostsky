<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamJoinFieldValue 模型
 * @mixin \think\Model
 */
class TeamJoinFieldValue extends Base
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

        'application_id' => 'integer',
        'field_id'       => 'integer',
        'value_string'   => 'string',
        'value_text'     => 'string',
        'value_int'      => 'integer',
        'value_decimal'  => 'float',
        'value_datetime' => 'integer',
        'value_json'     => 'string',
    ];

    /** JSON 字段 */
    protected $json = ['value_json'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['application_id', 'field_id'];

    public function application()
    {
        return $this->belongsTo(TeamJoinApplication::class, 'application_id');
    }

    public function field()
    {
        return $this->belongsTo(TeamJoinField::class, 'field_id');
    }

    public function setValueStringAttr($value)
    {
        return $value === null ? null : (string) $value;
    }

    public function setValueTextAttr($value)
    {
        return $value === null ? null : (string) $value;
    }

    public function setValueIntAttr($value)
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        return (int) $value;
    }

    public function setValueDecimalAttr($value)
    {
        return $value === null || $value === '' ? null : (float) $value;
    }

    public function setValueDatetimeAttr($value)
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (filter_var($value, FILTER_VALIDATE_INT) !== false) {
            return (int) $value;
        }

        return strtotime((string) $value);
    }

    public function setValueJsonAttr($value)
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_array($value)) {
            return $value;
        }

        return json_decode((string) $value, true);
    }
}
