<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\TeamAbility;
use think\exception\HttpException;
use think\Request;

class Ability
{
    public function handle(
        Request $request,
        \Closure $next,
        string $abilityKey = '',
        string $minimumLevel = '1',
        string ...$extra
    )
    {
        $abilityKey = trim($abilityKey);
        if ($abilityKey === '') {
            throw new HttpException(500, 'Ability 中间件必须指定能力标识');
        }

        if (str_contains($abilityKey, ',') || str_contains($abilityKey, ':')) {
            throw new HttpException(500, 'Ability 中间件能力标识格式无效');
        }

        if ($extra) {
            throw new HttpException(500, 'Ability 中间件最多接受两个参数');
        }

        if (!ctype_digit($minimumLevel) || (int) $minimumLevel < 1) {
            throw new HttpException(500, 'Ability 中间件最低等级必须为正整数');
        }

        $team = $request->team ?? null;
        if (!$team) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        $ability = TeamAbility::where('team_id', $team->id)
            ->where('ability_key', $abilityKey)
            ->find();

        if (!$ability) {
            throw new HttpException(403, '团队未开通所需能力');
        }

        if ($ability->level < (int) $minimumLevel) {
            throw new HttpException(403, '团队能力等级不足');
        }

        if ($ability->expire_time > 0 && $ability->expire_time < time()) {
            throw new HttpException(403, '团队能力已过期');
        }

        return $next($request);
    }
}
