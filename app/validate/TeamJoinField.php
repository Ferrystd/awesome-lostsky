<?php
declare (strict_types = 1);

namespace app\validate;

use think\Validate;

class TeamJoinField extends Validate
{
    protected $rule = [
        'id'                       => 'require|integer',
        'field_key'                => 'require|length:1,64|regex:^[a-z][a-z0-9_]*$',
        'name'                     => 'require|length:1,50',
        'value_type'               => 'in:string,text,int,decimal,bool,date,datetime,select,multi_select,json',
        'input_type'               => 'in:text,textarea,radio,checkbox,select,date,datetime,upload',
        'default_value'            => 'max:500',
        'is_apply_fillable'        => 'in:0,1',
        'is_apply_required'        => 'in:0,1',
        'is_transfer_member_field' => 'in:0,1',
        'member_field_id'          => 'integer',
        'is_active'                => 'in:0,1',
        'sort'                     => 'integer',
    ];

    protected $message = [
        'id.require'                       => '申请字段ID不能为空',
        'id.integer'                       => '申请字段ID格式不正确',
        'field_key.require'                => '字段标识不能为空',
        'field_key.length'                 => '字段标识长度需在1-64位之间',
        'field_key.regex'                  => '字段标识只能使用小写字母、数字、下划线，且必须以字母开头',
        'name.require'                     => '字段名称不能为空',
        'name.length'                      => '字段名称长度需在1-50位之间',
        'value_type.in'                    => '字段值类型不支持',
        'input_type.in'                    => '字段输入类型不支持',
        'default_value.max'                => '默认值长度不能超过500位',
        'is_apply_fillable.in'             => '申请可填写状态格式不正确',
        'is_apply_required.in'             => '申请必填状态格式不正确',
        'is_transfer_member_field.in'      => '转存状态格式不正确',
        'member_field_id.integer'          => '转存成员字段ID格式不正确',
        'is_active.in'                     => '启用状态格式不正确',
        'sort.integer'                     => '排序格式不正确',
    ];

    protected $scene = [
        'create' => ['field_key', 'name', 'value_type', 'input_type', 'options', 'default_value', 'is_apply_fillable', 'is_apply_required', 'is_transfer_member_field', 'member_field_id', 'is_active', 'sort'],
        'update' => ['name', 'value_type', 'input_type', 'options', 'default_value', 'is_apply_fillable', 'is_apply_required', 'is_transfer_member_field', 'member_field_id', 'is_active', 'sort'],
        'delete' => ['id'],
    ];
}
