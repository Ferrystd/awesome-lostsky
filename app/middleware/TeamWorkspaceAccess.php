<?php
declare(strict_types=1);

namespace app\middleware;

use app\service\WorkspaceAccess;
use think\exception\HttpException;
use think\Request;

final class TeamWorkspaceAccess
{
    public function handle(Request $request, \Closure $next)
    {
        if (($request->authenticated_user_id ?? 0) < 1) {
            throw new HttpException(500, 'TeamWorkspaceAccess 中间件必须在 Context 之后运行');
        }
        $teamId = $request->team_id ?? 0;
        if ($teamId < 1) {
            throw new HttpException(400, '无法确定团队上下文');
        }
        $acting = $request->acting_entity ?? null;
        if (!is_array($acting)) {
            throw new HttpException(500, 'TeamWorkspaceAccess 中间件必须在 EntityRequired 之后运行');
        }

        $request->workspace_access = app(WorkspaceAccess::class)->assert(
            $teamId,
            $acting,
            (string) ($request->slug ?? '')
        );

        return $next($request);
    }
}
