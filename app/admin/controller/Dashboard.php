<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

final class Dashboard
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_DASHBOARD_READ,
    ];

    public function index(Request $request)
    {
        return success(app(\app\service\PlatformAdmin::class)->dashboard($request->user_id));
    }
}
