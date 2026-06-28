<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\ManageScope;
use app\enum\Visibility;
use app\model\Base;

/**
 * TeamMemberField 模型
 * @mixin \think\Model
 */
class TeamMemberField extends Base
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

        'team_id'       => 'integer',
        'field_key'     => 'string',
        'name'          => 'string',
        'source'        => 'string',
        'value_type'    => 'string',
        'input_type'    => 'string',
        'options'       => 'string',
        'default_value' => 'string',
        'is_required'   => 'integer',
        'manager_scope' => ManageScope::class,
        'visibility'    => Visibility::class,
        'is_editable'   => 'integer',
        'is_searchable' => 'integer',
        'is_system'     => 'integer',
        'sort'          => 'integer',
    ];

    /** JSON 字段 */
    protected $json = ['options'];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'field_key', 'is_system'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function fieldValues()
    {
        return $this->hasMany(TeamMemberFieldValue::class, 'field_id');
    }

    public function visibilityTargets()
    {
        return $this->morphMany(VisibilityTarget::class, 'visibleable');
    }

    public function setFieldKeyAttr($value)
    {
        return strtolower(trim((string) $value));
    }

    public function setNameAttr($value)
    {
        return trim((string) $value);
    }

    public function setSourceAttr($value)
    {
        return strtolower(trim((string) $value));
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
