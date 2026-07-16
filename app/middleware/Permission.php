<?php
declare (strict_types = 1);

namespace app\middleware;

use app\model\TeamMemberRole;
use app\model\TeamRolePermission;
use think\exception\HttpException;
use think\Request;

class Permission
{
    public function handle(Request $request, \Closure $next, string $permissionKey)
    {
        $teamId   = (int) ($request->team_id ?? 0);
        $memberId = (int) ($request->member_id ?? 0);

        if ($teamId < 1) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        if (!$request->member || $memberId < 1) {
            throw new HttpException(403, '你不是该团队的成员');
        }

        if ($request->member->is_blocked) {
            throw new HttpException(403, '你已被该团队封禁');
        }

        if ($permissionKey === '' || !preg_match('/^[a-z][a-z0-9._-]*$/', $permissionKey)) {
            throw new HttpException(500, '权限配置无效');
        }

        $roleIds = TeamMemberRole::where('team_id', $teamId)
            ->where('member_id', $memberId)
            ->column('role_id');

        if (!$roleIds) {
            throw new HttpException(403, '你没有执行此操作的权限');
        }

        $permission = TeamRolePermission::where('team_id', $teamId)
            ->where('permission_key', $permissionKey)
            ->whereIn('role_id', $roleIds)
            ->find();

        if (!$permission) {
            throw new HttpException(403, '你没有执行此操作的权限');
        }

        return $next($request);
    }
}
