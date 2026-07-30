<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

final class Operations
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_AUDIT_READ => ['only' => ['auditEvents']],
        'AdminPermission:' . Permissions::ADMIN_SYSTEM_READ => ['only' => ['health']],
    ];

    public function auditEvents(Request $request)
    {
        return success(app(\app\service\PlatformAdmin::class)->auditEvents([
            'application' => $request->get('application/s', ''),
            'action' => $request->get('action/s', ''),
            'resource_type' => $request->get('resource_type/s', ''),
            'resource_id' => $request->get('resource_id/d', 0),
            'actor_user_id' => $request->get('actor_user_id/d', 0),
            'page' => $request->get('page/d', 1),
            'limit' => $request->get('limit/d', 20),
        ]));
    }

    public function health()
    {
        return success(app(\app\service\PlatformAdmin::class)->systemHealth());
    }
}
