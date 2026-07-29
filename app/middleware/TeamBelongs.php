<?php
declare(strict_types=1);

namespace app\middleware;

use app\exception\EntityContextException;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\TeamVirtual;
use think\exception\HttpException;
use think\Request;

/**
 * 确认显式实体身份归属于 AppResolver 解析出的当前团队。
 *
 * 只验证归属，不重复处理实体状态、领取权限或角色权限。
 */
class TeamBelongs
{
    public function handle(Request $request, \Closure $next)
    {
        if (($request->authenticated_user_id ?? 0) < 1) {
            throw new HttpException(500, 'TeamBelongs 中间件必须在 Context 之后运行');
        }

        $teamId = ($request->team_id ?? 0);
        if ($teamId < 1) {
            throw new HttpException(400, '无法确定团队上下文');
        }

        $acting = $request->acting_entity ?? null;
        if (!is_array($acting)) {
            throw EntityContextException::required((string) ($request->slug ?? ''));
        }

        $type = (string) ($acting['type'] ?? '');
        $id = (int) ($acting['id'] ?? 0);
        $belongs = $id > 0 && match ($type) {
            'team' => $id === $teamId,
            'teamMember' => (bool) TeamMember::where('team_id', $teamId)->where('id', $id)->find(),
            'teamCustomer' => (bool) TeamCustomer::where('team_id', $teamId)->where('id', $id)->find(),
            'teamVirtual' => (bool) TeamVirtual::where('team_id', $teamId)->where('id', $id)->find(),
            default => false,
        };

        if (!$belongs) {
            throw EntityContextException::teamMismatch((string) ($request->slug ?? ''));
        }

        return $next($request);
    }
}
