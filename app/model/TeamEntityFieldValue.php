<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\TeamEntityType;

class TeamEntityFieldValue extends Base
{
    use concern\BelongsToEntity;

    protected $type = [
        'team_id'        => 'integer',
        'field_id'       => 'integer',
        'value_json' => 'string',
        'entity_id'      => 'integer',
        // 'value_string'   => 'null|string',
        // 'value_text'     => 'null|string',
        // 'value_int'      => 'null|integer',
        // 'value_decimal'  => 'null|float',
        // 'value_datetime' => 'null|integer',
        // 'value_json'     => 'null|json',
    ] + self::COMMON_TYPES;

    protected $json = [];
    protected $append = [];
    protected $readonly = ['team_id', 'field_id', 'entity_id'];

    public function field()
    {
        return $this->belongsTo(TeamEntityField::class, 'field_id');
    }

    // ThinkORM Json 会包装字符串并将 false/0 变为 []；此列需要保留 JSON 标量。
    public function setValueJsonAttr(mixed $value): ?string
    {
        return $value === null ? null : json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    public function getValueJsonAttr(mixed $value): mixed
    {
        return $value === null ? null : json_decode($value, true, 512, JSON_THROW_ON_ERROR);
    }
}
