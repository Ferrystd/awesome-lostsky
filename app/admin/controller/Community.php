<?php
declare(strict_types=1);
namespace app\admin\controller;
use think\Request;
use app\service\PermissionDictionary as Permissions;
final class Community extends \app\controller\CommunityManagement
{
    protected $middleware = ['JwtAuth', 'Context', 'AdminAccess'];
    protected function authorize(Request $request, string $operation): ?int
    {
        $access = app(\app\service\PlatformAdminAccess::class);
        $access->assert($request->user_id, Permissions::ADMIN_COMMUNITY_READ);
        if ($operation !== 'read') $access->assert($request->user_id, $operation === 'write' ? Permissions::ADMIN_COMMUNITY_WRITE : Permissions::ADMIN_COMMUNITY_MODERATE);
        return null;
    }
    protected function application(): string { return 'admin'; }
}
