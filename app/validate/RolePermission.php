<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class RolePermission extends Validate
{
    protected $rule = [
        'role_id'        => 'require|integer|gt:0',
        'permission_keys' => 'array',
    ];

    protected $message = [
        'role_id.require'         => '角色ID不能为空',
        'role_id.integer'         => '角色ID格式不正确',
        'role_id.gt'              => '角色ID格式不正确',
        'permission_keys.array'   => '权限列表格式不正确',
    ];

    protected $scene = [
        'save' => ['role_id', 'permission_keys'],
    ];
}
