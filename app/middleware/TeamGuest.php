<?php
declare (strict_types = 1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

class TeamGuest
{
    public function handle(Request $request, \Closure $next)
    {
        if (empty($request->user_id)) {
            throw new HttpException(401, '请先登录');
        }

        if (empty($request->team_id)) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        if (!empty($request->member_id)) {
            throw new HttpException(409, '你已经是本团队成员');
        }

        return $next($request);
    }
}
