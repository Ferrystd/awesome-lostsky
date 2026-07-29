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
        $userAgent = $this->userAgent($request);

        $service = app(LoginService::class);
        $result  = $service->byPhone($phone, $password, [
            'device_name' => $request->post('device_name', ''),
            'ua'          => $userAgent,
        ]);

        return success($result);
    }

    public function password(Request $request)
    {
        $account  = $request->post('account', '');
        $password = $request->post('password', '');
        $userAgent = $this->userAgent($request);

        $service = app(LoginService::class);
        $result  = $service->byAccount($account, $password, [
            'device_name' => $request->post('device_name', ''),
            'ua'          => $userAgent,
        ]);

        return success($result);
    }

    public function sms(Request $request)
    {
        $result = app(LoginService::class)->bySms(
            $request->post('phone/s', ''),
            $request->post('code/s', ''),
            [
                'device_name' => $request->post('device_name', ''),
                'ua' => $this->userAgent($request),
            ]
        );

        return success($result);
    }

    public function refresh(Request $request)
    {
        $result = app(LoginService::class)->refresh($request->post('refresh_token/s', ''));

        return success($result);
    }

    private function userAgent(Request $request): string
    {
        $value = $request->header('User-Agent', '');

        return is_scalar($value) ? (string) $value : '';
    }
}
