<?php
declare(strict_types=1);

namespace app\middleware;

use app\exception\EntityContextException;
use think\exception\HttpException;
use think\Request;

class EntityRequired
{
    public function handle(Request $request, \Closure $next)
    {
        if (($request->authenticated_user_id ?? 0) < 1) {
            throw new HttpException(500, 'EntityRequired 中间件必须在 Context 之后运行');
        }

        if (!is_array($request->acting_entity ?? null)) {
            $teamSlug = (string) ($request->slug ?? '');
            throw EntityContextException::required($teamSlug !== '' ? $teamSlug : null);
        }

        return $next($request);
    }
}
