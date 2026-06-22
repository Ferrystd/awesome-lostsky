<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Member extends Validate
{
    protected $rule = [
        'user_id'       => 'require|integer',
        'member_id'     => 'require|integer',
        'nickname'      => 'max:50',
        'avatar'        => 'max:255',
        'is_displayed'  => 'in:0,1',
        'post_type_ids' => 'array',
    ];

    protected $message = [
        'user_id.require'       => '用户ID不能为空',
        'user_id.integer'       => '用户ID格式不正确',
        'member_id.require'     => '成员ID不能为空',
        'member_id.integer'     => '成员ID格式不正确',
        'nickname.max'          => '昵称长度不能超过50位',
        'avatar.max'            => '头像地址长度不能超过255位',
        'is_displayed.in'       => '显示状态格式不正确',
        'post_type_ids.array'   => '岗位类型格式不正确',
    ];

    protected $scene = [
        'add'    => ['nickname', 'avatar', 'post_type_ids'],
        'edit'   => ['nickname', 'avatar', 'is_displayed', 'post_type_ids'],
        'block'  => ['member_id'],
        'remove' => ['member_id'],
    ];
}
