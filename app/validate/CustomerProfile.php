<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class CustomerProfile extends Validate
{
    protected $rule = [
        'nickname' => 'require|length:1,50',
        'avatar' => 'max:500',
        'description' => 'max:500',
        'slug' => 'regex:^[a-zA-Z][a-zA-Z0-9_-]+$|length:2,50',
    ];

    protected $message = [
        'nickname.require' => '昵称不能为空', 'nickname.length' => '昵称长度需在1-50位',
        'avatar.max' => '头像地址过长', 'description.max' => '简介不能超过500位',
        'slug.regex' => '标识格式不正确', 'slug.length' => '标识长度需在2-50位',
    ];

    protected $scene = [
        'update' => ['nickname', 'avatar', 'description'],
        'slug' => ['slug'],
    ];
}
