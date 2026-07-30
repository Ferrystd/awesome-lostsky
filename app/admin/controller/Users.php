<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

final class Users
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_USER_READ => ['only' => ['index', 'get']],
        'AdminPermission:' . Permissions::ADMIN_USER_MODERATE => ['only' => ['ban', 'unban']],
        'AdminPermission:' . Permissions::ADMIN_USER_SESSION_REVOKE => ['only' => ['revokeSessions']],
    ];

    public function index(Request $request)
    {
        $userId = $request->user_id;
        return success(app(\app\service\PlatformAdmin::class)->users([
            'q' => $request->get('q/s', ''),
            'status' => $request->get('status/s', ''),
            'page' => $request->get('page/d', 1),
            'limit' => $request->get('limit/d', 20),
        ], app(\app\service\PlatformAdminAccess::class)->has(
            $userId,
            Permissions::ADMIN_USER_SENSITIVE_READ
        )));
    }

    public function get(Request $request)
    {
        $userId = $request->user_id;
        return success(app(\app\service\PlatformAdmin::class)->user(
            $request->route('id/d'),
            app(\app\service\PlatformAdminAccess::class)->has(
                $userId,
                Permissions::ADMIN_USER_SENSITIVE_READ
            )
        ));
    }

    public function ban(Request $request)
    {
        return $this->moderate($request, true);
    }

    public function unban(Request $request)
    {
        return $this->moderate($request, false);
    }

    public function revokeSessions(Request $request)
    {
        app(\app\service\PlatformAdmin::class)->revokeUserSessions(
            $request->user_id,
            $request->route('id/d'),
            $request->post('reason/s', ''),
            $request
        );
        return message('用户全部会话已撤销');
    }

    private function moderate(Request $request, bool $banned)
    {
        app(\app\service\PlatformAdmin::class)->moderateUser(
            $request->user_id,
            $request->route('id/d'),
            $banned,
            $request->post('reason/s', ''),
            $request
        );
        return message($banned ? '用户已封禁' : '用户已解封');
    }
}
