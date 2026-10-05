<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

final class SiteContent
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_SITE_READ => ['only' => ['index']],
        'AdminPermission:' . Permissions::ADMIN_SITE_WRITE => ['only' => ['save']],
    ];

    public function index()
    {
        return success(app(\app\service\SiteContent::class)->get());
    }

    public function save(Request $request)
    {
        return success(app(\app\service\SiteContent::class)->save($request->post(), $request));
    }
}
