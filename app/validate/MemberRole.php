<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class MemberRole extends Validate
{
    protected $rule = [
        'member_id' => 'require|integer|gt:0',
        'role_ids'  => 'array',
    ];

    protected $message = [
        'member_id.require' => '成员ID不能为空',
        'member_id.integer' => '成员ID格式不正确',
        'member_id.gt'      => '成员ID格式不正确',
        'role_ids.array'    => '角色列表格式不正确',
    ];

    protected $scene = [
        'save' => ['member_id', 'role_ids'],
    ];
}
