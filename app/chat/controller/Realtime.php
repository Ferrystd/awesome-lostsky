<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Realtime
{
    protected $middleware = ['JwtAuth', 'Context', 'ChatAccess'];

    public function connect(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->connectionToken((int) $request->user_id));
    }

    public function subscribe(\think\Request $request)
    {
        return success(app(\app\service\ChatRealtime::class)->subscriptionToken(
            (int) $request->team_id, (int) $request->user_id,
            (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0),
            (string) $request->post('conversation', '')
        ));
    }
}
