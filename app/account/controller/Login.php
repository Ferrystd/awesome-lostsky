<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\Login as LoginService;
use think\Request;

class Login
{
    public function phone(Request $request)
    {
        $phone    = $request->post('phone', '');
        $password = $request->post('password', '');

        $service = app(LoginService::class);
        $result  = $service->byPhone($phone, $password, [
            'device_name' => $request->post('device_name', ''),
            'ua'          => $request->header('User-Agent', ''),
        ]);

        return success($result);
    }

    public function password(Request $request)
    {
        $account  = $request->post('account', '');
        $password = $request->post('password', '');

        $service = app(LoginService::class);
        $result  = $service->byAccount($account, $password, [
            'device_name' => $request->post('device_name', ''),
            'ua'          => $request->header('User-Agent', ''),
        ]);

        return success($result);
    }
}
