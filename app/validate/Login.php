<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Login extends Validate
{
    protected $rule = [
        'phone'    => 'require|mobile',
        'account'  => 'require|regex:/^[\w\-@.]+$/',
        'password' => 'require|length:6,32',
    ];

    protected $message = [
        'phone.require'     => '手机号不能为空',
        'phone.mobile'      => '手机号格式不正确',
        'account.require'   => '账号不能为空',
        'account.regex'     => '账号包含非法字符',
        'password.require'  => '密码不能为空',
        'password.length'   => '密码长度需在6-32位之间',
    ];

    protected $scene = [
        'phone'    => ['phone', 'password'],
        'password' => ['account', 'password'],
    ];
}
