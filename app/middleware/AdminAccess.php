<?php
declare(strict_types=1);

namespace app\middleware;

use think\Request;

final class AdminAccess
{
    public function handle(Request $request, \Closure $next)
    {
        app(\app\service\PlatformAdminAccess::class)->assertAdmin($request->user_id);

        return $next($request);
    }
}
