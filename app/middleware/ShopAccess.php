<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

/**
 * 商城管理权限中间件
 * 当前仅团队所有者可管理，后续拆分细化
 */
class ShopAccess
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;

        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        if ($team->user_id !== $request->user_id) {
            throw new HttpException(403, '仅团队所有者可管理商城');
        }

        return $next($request);
    }
}
