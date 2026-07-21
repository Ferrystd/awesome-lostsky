<?php
declare (strict_types = 1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

class Permission
{
    public function handle(Request $request, \Closure $next, string ...$permissionTemplates)
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

        $gate = app(\app\service\PermissionGate::class);
        $gate->assert($teamId, $memberId, $gate->candidates($request, ...$permissionTemplates));

        return $next($request);
    }
}
