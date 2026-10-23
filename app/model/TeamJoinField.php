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
    use concern\BelongsToTeam;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id'                  => 'integer',
        'field_key'                => 'string',
        'name'                     => 'string',
        'value_type'               => 'string',
        'input_type'               => 'string',
        'default_value'            => 'string',
        'is_apply_fillable'        => 'integer',
        'is_apply_required'        => 'integer',
        'is_transfer_entity_field' => 'integer',
        'entity_field_id'          => 'integer',
        'is_active'                => 'integer',
        'sort'                     => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = ['options'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'field_key'];

    public function entityField()
    {
        return $this->belongsTo(TeamEntityField::class, 'entity_field_id');
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
