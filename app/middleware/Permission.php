<?php
declare (strict_types = 1);

namespace app\middleware;

use app\exception\EntityContextException;
use think\exception\HttpException;
use think\Request;

class Permission
{
    public function handle(Request $request, \Closure $next, string ...$permissionTemplates)
    {
        $teamId = (int) ($request->team_id ?? 0);
        $subject = $request->acting_entity ?? null;

        if ($teamId < 1) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        if (!is_array($subject) || ($subject['id'] ?? 0) < 1) {
            throw EntityContextException::required((string) ($request->slug ?? ''));
        }

        $gate = app(\app\service\PermissionGate::class);
        $gate->assert($teamId, $subject, $gate->candidates($request, ...$permissionTemplates));

        return $next($request);
    }
}
