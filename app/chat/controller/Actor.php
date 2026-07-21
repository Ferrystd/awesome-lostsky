<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Actor
{
    protected $middleware = ['JwtAuth', 'Context', 'ChatAccess'];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatActor::class)->list(
            (int) $request->team_id,
            (int) ($request->member_id ?? 0),
            (int) ($request->customer_id ?? 0)
        ));
    }
}
