<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;
use app\model\TeamAbility;

class DocAbility
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;

        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        $ability = TeamAbility::where('team_id', $team->id)
            ->where('ability_key', 'doc')
            ->find();

        if (!$ability || $ability->level < 1) {
            throw new HttpException(403, '团队未开通文档能力');
        }

        if ($ability->expire_time > 0 && $ability->expire_time < time()) {
            throw new HttpException(403, '团队文档能力已过期');
        }

        return $next($request);
    }
}
