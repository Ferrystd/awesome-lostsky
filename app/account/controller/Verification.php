<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\SmsVerification;
use think\Request;

class Verification
{
    public function sms(Request $request)
    {
        $result = app(SmsVerification::class)->send(
            $request->post('phone/s', ''),
            $request->post('purpose/s', '')
        );

        return success($result);
    }
}
