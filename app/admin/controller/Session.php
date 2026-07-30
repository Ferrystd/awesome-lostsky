<?php
declare(strict_types=1);

namespace app\admin\controller;

use think\Request;

final class Session
{
    protected $middleware = ['JwtAuth', 'Context', 'AdminAccess'];

    public function index(Request $request)
    {
        return success(app(\app\service\PlatformAdminAccess::class)->session($request->user_id));
    }

    public function search(Request $request)
    {
        return success(app(\app\service\PlatformAdmin::class)->search(
            $request->get('q/s', ''),
            $request->user_id
        ));
    }
}
