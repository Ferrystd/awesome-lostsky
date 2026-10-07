<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class SmsVerification extends Validate
{
    protected $rule = [
        'phone'   => 'require|mobile',
        'purpose' => 'require|in:register,login,recovery,recovery_phone',
        'code'    => 'require|regex:/^[0-9]{4,8}$/',
    ];

    protected $message = [
        'phone.require'   => '手机号不能为空',
        'phone.mobile'    => '手机号格式不正确',
        'purpose.require' => '验证码用途不能为空',
        'purpose.in'      => '验证码用途不正确',
        'code.require'    => '验证码不能为空',
        'code.regex'      => '验证码格式不正确',
    ];

    protected $scene = [
        'send'   => ['phone', 'purpose'],
        'verify' => ['phone', 'code'],
    ];
}
