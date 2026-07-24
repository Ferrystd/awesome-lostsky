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
        $subject = $request->acting_entity ?: ['type' => 'teamMember', 'id' => (int) ($request->member_id ?? 0)];

        if ($teamId < 1) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        if (($subject['id'] ?? 0) < 1) {
            throw new HttpException(403, '你不是该团队的成员');
        }

        if ($request->member && $request->member->is_blocked) {
            throw new HttpException(403, '你已被该团队封禁');
        }

        $gate = app(\app\service\PermissionGate::class);
        $gate->assert($teamId, $subject, $gate->candidates($request, ...$permissionTemplates));

        return $next($request);
    }
}
