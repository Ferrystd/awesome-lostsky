<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

/**
 * 账本管理权限中间件
 * 校验当前成员是否有权管理账本（删除/配置等）
 *
 * 当前仅团队所有者可管理，后续可扩展 post 角色检查
 */
class TransactionAccess
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;

        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        if ($team->user_id !== $request->user_id) {
            throw new HttpException(403, '仅团队所有者可管理账本');
        }

        return $next($request);
    }
}
