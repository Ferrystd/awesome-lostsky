<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\TeamMember as TeamMemberModel;
use think\exception\HttpException;
use think\Request;

/**
 * 团队成员中间件
 * 验证当前 JWT 用户是否为当前团队的非封禁成员，并绑定成员实例
 */
class TeamMember
{
    public function handle(Request $request, \Closure $next)
    {
        $userId = (int) ($request->jwt->uid ?? 0);
        $team   = $request->team ?? null;

        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        $member = TeamMemberModel::where('team_id', $team->id)
            ->where('user_id', $userId)
            ->find();

        if (!$member) {
            throw new HttpException(403, '你不是该团队的成员');
        }

        if ($member->is_blocked) {
            throw new HttpException(403, '你已被该团队封禁');
        }

        $request->member = $member;

        return $next($request);
    }
}
