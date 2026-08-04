<?php
declare(strict_types=1);

namespace app\middleware;

use app\exception\AccessDeniedException;
use app\service\AbilityResolver;
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

        $ability = app(AbilityResolver::class)->resolve((int) $team->id, $abilityKey, (int) $minimumLevel);
        if (!$ability['enabled']) {
            throw AccessDeniedException::ability(
                $abilityKey,
                $this->label($abilityKey),
                (int) $minimumLevel,
                $ability['reason']
            );
        }

        return $next($request);
    }

    private function label(string $abilityKey): string
    {
        return match ($abilityKey) {
            'file' => '文件上传',
            'doc' => '文档',
            'transaction' => '记账',
            default => $abilityKey,
        };
    }
}
