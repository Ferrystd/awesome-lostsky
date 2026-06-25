<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;
use app\model\TeamAbility as TeamAbilityModel;

/**
 * 团队记账能力中间件
 * 检查当前团队是否具备 ability_key = 'transaction' 且 level >= 1 且未过期
 */
class TransactionAbility
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;

        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        $ability = TeamAbilityModel::where('team_id', $team->id)
            ->where('ability_key', 'transaction')
            ->find();

        if (!$ability) {
            throw new HttpException(403, '团队未开通记账能力');
        }

        if ($ability->level < 1) {
            throw new HttpException(403, '团队记账能力未启用');
        }

        if ($ability->expire_time > 0 && $ability->expire_time < time()) {
            throw new HttpException(403, '团队记账能力已过期');
        }

        return $next($request);
    }
}
