<?php
declare (strict_types = 1);

namespace app\middleware;

use app\exception\EntityContextException;

class ChatAccess
{
    /**
     * 处理请求
     *
     * @param \think\Request $request
     * @param \Closure       $next
     * @return Response
     */
    public function handle(\think\Request $request, \Closure $next)
    {
        if (!is_array($request->acting_entity ?? null)) {
            throw EntityContextException::required((string) ($request->slug ?? ''));
        }

        return $next($request);
    }
}
