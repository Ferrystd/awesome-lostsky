<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\TeamEntityType;
use app\enum\ManageScope;
use app\enum\Visibility;

class TeamEntityField extends Base
{
    use concern\BelongsToTeam;

    protected $type = [
        'team_id'       => 'integer',
        'entity_type'   => TeamEntityType::class,
        'field_key'     => 'string',
        'name'          => 'string',
        'source'        => 'string',
        'value_type'    => 'string',
        'input_type'    => 'string',
        'default_value' => 'string',
        'manager_scope' => ManageScope::class,
        'visibility'    => Visibility::class,
        'is_required'   => 'integer',
        'is_searchable' => 'integer',
        'is_system'     => 'integer',
        'sort'          => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = ['options'];
    protected $append = [];
    protected $readonly = ['team_id', 'entity_type', 'field_key', 'is_system'];

    public function setFieldKeyAttr($value): string
    {
        return strtolower(trim((string) $value));
    }

    public function setNameAttr($value): string
    {
        return trim((string) $value);
    }

    public function fieldValues()
    {
        return $this->hasMany(TeamEntityFieldValue::class, 'field_id');
    }

    public function visibilityTargets()
    {
        return $this->morphMany(VisibilityTarget::class, 'visibleable');
    }
}
