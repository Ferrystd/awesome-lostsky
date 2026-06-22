<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

/**
 * 团队管理权限中间件
 *
 * 当前（一刀切）：校验当前用户是否为团队创建者
 * 后续：基于岗位类型/角色体系做精细权限控制
 */
class TeamAccess
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;

        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        // 当前一刀切：团队创建者 = 管理员
        if ((int) $team->user_id !== $request->user_id) {
            throw new HttpException(403, '仅团队创建者可执行此操作');
        }

        return $next($request);
    }
}
