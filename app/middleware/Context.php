<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\TeamCustomer as TeamCustomerModel;
use app\model\TeamMember as TeamMemberModel;
use think\Request;

/**
 * 统一上下文中间件
 *
 * 依赖 JwtAuth 已运行，从 $request->jwt 和 $request->team 中提取：
 *   user_id   — JWT 用户 ID
 *   team_id   — 团队 ID（来自 route/app.php 域名解析）
 *   member    — 用户在此团队的成员记录（可能为 null）
 *   member_id — 成员记录 ID
 *   customer  — 用户在此团队的顾客记录（可能为 null）
 *   customer_id — 顾客记录 ID
 *
 * 只做提取，不做鉴权。鉴权由 MemberAccess / TeamAccess 完成。
 */
class Context
{
    public function handle(Request $request, \Closure $next)
    {
        $request->user_id = (int) ($request->jwt->uid ?? 0);

        $team = $request->team ?? null;

        if ($team) {
            $request->team_id = (int) $team->id;

            $member = TeamMemberModel::where('team_id', $team->id)
                ->where('user_id', $request->user_id)
                ->find();

            if ($member) {
                $request->member    = $member;
                $request->member_id = (int) $member->id;
            }

            $customer = TeamCustomerModel::inTeam((int) $team->id)
                ->ofUser($request->user_id)
                ->with(['profile', 'balance'])
                ->find();

            if ($customer) {
                $request->customer    = $customer;
                $request->customer_id = (int) $customer->id;
            }
        }

        return $next($request);
    }
}
