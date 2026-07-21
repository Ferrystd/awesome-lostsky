<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\TeamEntityType;

class TeamEntityFieldValue extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'        => 'integer',
        'field_id'       => 'integer',
        'entity_type'    => TeamEntityType::class,
        'entity_id'      => 'integer',
        // 'value_string'   => 'null|string',
        // 'value_text'     => 'null|string',
        // 'value_int'      => 'null|integer',
        // 'value_decimal'  => 'null|float',
        // 'value_datetime' => 'null|integer',
        // 'value_json'     => 'null|json',
    ];

    protected $json = ['value_json'];
    protected $hidden = ['delete_time'];
    protected $append = [];
    protected $readonly = ['team_id', 'field_id', 'entity_type', 'entity_id'];

    public function field()
    {
        return $this->belongsTo(TeamEntityField::class, 'field_id');
    }

    public function entityable()
    {
        return $this->morphTo('entity', [
            'member' => TeamMember::class,
            'customer' => TeamCustomer::class,
            'virtual' => TeamVirtual::class,
        ]);
    }
}
