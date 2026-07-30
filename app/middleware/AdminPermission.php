<?php
declare(strict_types=1);

namespace app\middleware;

use think\Request;

final class AdminPermission
{
    public function handle(Request $request, \Closure $next, string ...$permissions)
    {
        app(\app\service\PlatformAdminAccess::class)->assert(
            $request->user_id,
            ...$permissions
        );

        return $next($request);
    }
}
