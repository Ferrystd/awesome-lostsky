<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\AccountRecovery;
use think\Request;

class Recovery
{
    public function verify(Request $request)
    {
        return success(app(AccountRecovery::class)->verify(
            $request->post('phone/s', ''), $request->post('code/s', '')
        ))->header(['Cache-Control' => 'no-store']);
    }

    public function phoneSms(Request $request)
    {
        return success(app(AccountRecovery::class)->sendPhoneSms(
            $request->post('recovery_token/s', ''), $request->post('phone/s', '')
        ))->header(['Cache-Control' => 'no-store']);
    }

    public function password(Request $request)
    {
        app(AccountRecovery::class)->password($request->post('recovery_token/s', ''), $request->post('password/s', ''));
        return success(null)->header(['Cache-Control' => 'no-store']);
    }

    public function phone(Request $request)
    {
        app(AccountRecovery::class)->phone(
            $request->post('recovery_token/s', ''), $request->post('phone/s', ''), $request->post('code/s', '')
        );
        return success(null)->header(['Cache-Control' => 'no-store']);
    }
}
