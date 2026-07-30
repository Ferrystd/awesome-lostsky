<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class TeamEntityField extends Validate
{
    protected $rule = [
        'entity_type' => 'require|in:entity,customer,virtual',
        'field_key' => 'require|regex:^[a-z][a-z0-9_]*$|length:1,64',
        'name' => 'require|length:1,50',
        'value_type' => 'in:string,text,int,decimal,bool,date,datetime,select,multi_select,json',
        'input_type' => 'in:text,textarea,radio,checkbox,select,date,datetime',
        'options' => 'array',
        'source' => 'in:system,custom',
        'default_value' => 'max:500',
        'manager_scope' => 'in:1,2',
        'visibility' => 'in:1,3,4,5,6',
        'is_required' => 'in:0,1', 'is_editable' => 'in:0,1', 'is_searchable' => 'in:0,1',
        'sort' => 'integer',
    ];

    protected $scene = [
        'create' => ['entity_type', 'field_key', 'name', 'source', 'value_type', 'input_type', 'options', 'default_value', 'manager_scope', 'visibility', 'is_required', 'is_editable', 'is_searchable', 'sort'],
    ];

    public function sceneUpdate(): self
    {
        return $this->only([
            'name', 'source', 'value_type', 'input_type', 'options', 'default_value',
            'manager_scope', 'visibility', 'is_required', 'is_editable',
            'is_searchable', 'sort',
        ])->remove('name', 'require');
    }
}
