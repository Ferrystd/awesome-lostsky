<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;
use app\model\TeamCustomer as TeamCustomerModel;
use app\model\TeamCustomerSender;
use app\model\TeamMember as TeamMemberModel;

/**
 * 记账操作权限中间件
 * 校验当前成员是否有权创建/编辑流水
 *
 * 规则（任一命中即通过）：
 *   A. 团队所有者
 *   B. 发单人已绑定该客户
 *   C. 匿名客户（walk-in）
 *   D. CS 角色（占位，始终 false）
 */
class TransactionVerify
{
    public function handle(Request $request, \Closure $next)
    {
        $team   = $request->team ?? null;
        $member = $request->member ?? null;

        // 规则 A：团队所有者
        if ($team->user_id === $request->user_id) {
            return $next($request);
        }

        $customerId = (int) ($request->post('customer_id', 0) ?: 0);
        $isEdit     = (bool) $request->param('id', 0);

        // 规则 B：发单人已绑定该客户
        if ($customerId > 0) {
            $customer = TeamCustomerModel::where('id', $customerId)
                ->where('team_id', $team->id)
                ->find();

            if ($customer && TeamCustomerSender::sender($member->id, $customerId)->find()) {
                return $next($request);
            }
        }

        // 规则 C：匿名客户（仅创建时允许，编辑不允许匿名绕过）
        if (!$isEdit && $customerId === 0) {
            return $next($request);
        }

        // 规则 D：CS 角色（占位）
        if (TeamMemberModel::cs()->where('id', $member->id)->find()) {
            return $next($request);
        }

        throw new HttpException(403, '你无权执行记账操作');
    }
}
