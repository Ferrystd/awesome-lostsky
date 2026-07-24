<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

/**
 * 成员资格校验中间件
 *
 * 依赖 Context 已运行，校验：
 *   - 成员记录存在（非成员 → 403）
 *   - 未被封禁（is_blocked → 403）
 *
 * 当前一刀切，后续结合角色/岗位权限体系做精细控制。
 */
class MemberAccess
{
    public function handle(Request $request, \Closure $next)
    {
        if ($request->acting_entity) {
            $acting = $request->acting_entity;
            if (($acting['type'] ?? '') !== 'teamMember' || (int) ($acting['id'] ?? 0) !== (int) ($request->member_id ?? 0)) {
                throw new HttpException(403, '当前实体不是该团队成员');
            }
        }

        if (!$request->member) {
            throw new HttpException(403, '你不是该团队的成员');
        }

        if ($request->member->is_blocked) {
            throw new HttpException(403, '你已被该团队封禁');
        }

        return $next($request);
    }
}
