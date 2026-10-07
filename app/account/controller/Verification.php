<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\SmsVerification;
use think\Request;

class Verification
{
    public function sms(Request $request)
    {
        if (!in_array($request->post('purpose/s', ''), [SmsVerification::PURPOSE_LOGIN, SmsVerification::PURPOSE_REGISTER, SmsVerification::PURPOSE_RECOVERY], true)) {
            throw new \think\exception\HttpException(422, '验证码用途不正确');
        }
        $result = app(SmsVerification::class)->send(
            $request->post('phone/s', ''),
            $request->post('purpose/s', '')
        );

        return success($result);
    }
}
