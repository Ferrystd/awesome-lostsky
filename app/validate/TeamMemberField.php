<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class TeamMemberField extends Validate
{
    protected $rule = [
        'id'            => 'require|integer',
        'field_key'     => 'require|length:1,64|regex:^[a-z][a-z0-9_]*$',
        'name'          => 'require|length:1,50',
        'source'        => 'in:system,custom',
        'value_type'    => 'in:string,text,int,decimal,bool,date,datetime,select,multi_select,json',
        'input_type'    => 'in:text,textarea,radio,checkbox,select,date,datetime,upload',
        'default_value' => 'max:500',
        'is_required'   => 'in:0,1',
        'manager_scope' => 'in:1,2',
        'visibility'    => 'in:1,2,3,4,5,6',
        'is_editable'   => 'in:0,1',
        'is_searchable' => 'in:0,1',
        'is_system'     => 'in:0,1',
        'sort'          => 'integer',
    ];

    protected $message = [
        'id.require'            => '成员字段ID不能为空',
        'id.integer'            => '成员字段ID格式不正确',
        'field_key.require'     => '字段标识不能为空',
        'field_key.length'      => '字段标识长度需在1-64位之间',
        'field_key.regex'       => '字段标识只能使用小写字母、数字、下划线，且必须以字母开头',
        'name.require'          => '字段名称不能为空',
        'name.length'           => '字段名称长度需在1-50位之间',
        'source.in'             => '字段来源格式不正确',
        'value_type.in'         => '字段值类型不支持',
        'input_type.in'         => '字段输入类型不支持',
        'default_value.max'     => '默认值长度不能超过500位',
        'is_required.in'        => '必填状态格式不正确',
        'manager_scope.in'      => '管理范围格式不正确',
        'visibility.in'         => '可见范围格式不正确',
        'is_editable.in'        => '编辑状态格式不正确',
        'is_searchable.in'      => '搜索状态格式不正确',
        'is_system.in'          => '系统字段状态格式不正确',
        'sort.integer'          => '排序格式不正确',
    ];

    protected $scene = [
        'create' => ['field_key', 'name', 'source', 'value_type', 'input_type', 'options', 'default_value', 'is_required', 'manager_scope', 'visibility', 'is_editable', 'is_searchable', 'is_system', 'sort'],
        'update' => ['name', 'value_type', 'input_type', 'options', 'default_value', 'is_required', 'manager_scope', 'visibility', 'is_editable', 'is_searchable', 'sort'],
        'delete' => ['id'],
    ];
}
