<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\Register as RegisterService;
use think\Request;

class Register
{
    /**
     * 手机号注册
     */
    public function phone(Request $request)
    {
        $phone    = $request->post('phone', '');
        $code     = $request->post('code', '');
        $password = $request->post('password', '');
        $userAgent = $request->header('User-Agent', '');
        $userAgent = is_scalar($userAgent) ? (string) $userAgent : '';

        $service = app(RegisterService::class);
        $result  = $service->phone($phone, $code, $password, [
            'device_name' => $request->post('device_name', ''),
            'ua'          => $userAgent,
        ]);

        return success($result);
    }
}
