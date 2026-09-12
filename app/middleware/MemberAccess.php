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
 *   - 成员实体当前具备业务可用性（is_valid → 403）
 *
 * 这里只校验成员身份和有效状态；具体业务权限由 Permission 等中间件单独校验。
 */
class MemberAccess
{
    public function handle(Request $request, \Closure $next)
    {
        $acting = $request->acting_entity ?? null;
        if (!is_array($acting)
            || ($acting['type'] ?? '') !== 'teamMember'
            || (int) ($acting['id'] ?? 0) !== ($request->member_id ?? 0)) {
            throw new HttpException(403, '当前人员不是该团队成员');
        }

        if (!isset($request->member)) {
            throw new HttpException(403, '你不是该团队的成员');
        }

        if (!(bool) $request->member->is_valid) {
            throw new HttpException(403, '当前成员身份不可用');
        }

        return $next($request);
    }
}
