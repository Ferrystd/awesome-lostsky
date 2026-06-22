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
        $password = $request->post('password', '');

        $service = app(RegisterService::class);
        $result  = $service->phone($phone, $password, [
            'device_name' => $request->post('device_name', ''),
            'ua'          => $request->header('User-Agent', ''),
        ]);

        return json($result);
    }
}
