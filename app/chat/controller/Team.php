<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Team
{
    protected $middleware = ['JwtAuth', 'Context'];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatTeam::class)->list((int) $request->user_id));
    }
}
