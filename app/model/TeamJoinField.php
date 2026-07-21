<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamJoinField 模型
 * @mixin \think\Model
 */
class TeamJoinField extends Base
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

        'team_id'                  => 'integer',
        'field_key'                => 'string',
        'name'                     => 'string',
        'value_type'               => 'string',
        'input_type'               => 'string',
        'options'                  => 'string',
        'default_value'            => 'string',
        'is_apply_fillable'        => 'integer',
        'is_apply_required'        => 'integer',
        'is_transfer_member_field' => 'integer',
        'member_field_id'          => 'integer',
        'is_active'                => 'integer',
        'sort'                     => 'integer',
    ];

    /** JSON 字段 */
    protected $json = ['options'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'field_key'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function memberField()
    {
        return $this->belongsTo(TeamEntityField::class, 'member_field_id');
    }

    public function values()
    {
        return $this->hasMany(TeamJoinFieldValue::class, 'field_id');
    }

    public function setFieldKeyAttr($value)
    {
        return strtolower(trim((string) $value));
    }

    public function setNameAttr($value)
    {
        return trim((string) $value);
    }

    public function setValueTypeAttr($value)
    {
        return strtolower(trim((string) $value));
    }

    public function setInputTypeAttr($value)
    {
        return strtolower(trim((string) $value));
    }

    public function searchTeamIdAttr($query, $value)
    {
        $query->where('team_id', (int) $value);
    }

    public function searchKeywordAttr($query, $value)
    {
        $keyword = trim((string) $value);
        if ($keyword !== '') {
            $query->whereLike('name|field_key', "%{$keyword}%");
        }
    }
}
