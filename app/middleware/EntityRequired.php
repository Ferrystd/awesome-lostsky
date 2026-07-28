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
        if ((int) ($request->authenticated_user_id ?? 0) < 1) {
            throw new HttpException(500, 'EntityRequired 中间件必须在 Context 之后运行');
        }

        if (!is_array($request->acting_entity ?? null)) {
            $teamSlug = (string) ($request->slug ?? '');
            if ($teamSlug === '') {
                throw new HttpException(400, '无法确定团队上下文');
            }

            throw EntityContextException::required($teamSlug);
        }

        return $next($request);
    }
}
