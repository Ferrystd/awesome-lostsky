<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Register extends Validate
{
    protected $rule = [
        'phone'    => 'require|mobile',
        'password' => 'require|length:6,32',
    ];

    protected $message = [
        'phone.require'    => '手机号不能为空',
        'phone.mobile'     => '手机号格式不正确',
        'password.require' => '密码不能为空',
        'password.length'  => '密码长度需在6-32位之间',
    ];
}
