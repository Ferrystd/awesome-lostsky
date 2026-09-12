<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;
use app\model\TeamCustomer as TeamCustomerModel;
use app\model\TeamCustomerSender;

/**
 * 记账操作权限中间件
 * 校验当前实体是否有权创建/编辑流水
 *
 * 规则（任一命中即通过）：
 *   A. 团队实体
 *   B. 发单人已绑定该顾客
 *   C. 匿名顾客（walk-in）
 */
class TransactionVerify
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;
        $actingEntity = ($request->acting_entity ?? []);
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        if (!$team || $entityId < 1) {
            throw new HttpException(403, '当前人员无效');
        }

        // 外部 Entity 已由 TeamWorkspaceAccess 复核目标团队角色，并由当前动作的
        // Permission 中间件决定是否可操作。它不应被目标团队内部的“自有顾客”规则再次限制。
        if ((bool) (($request->workspace_access['is_external'] ?? false))) {
            return $next($request);
        }

        // 规则 A：团队实体
        if (($actingEntity['type'] ?? '') === 'team') {
            return $next($request);
        }

        $customerId = (int) ($request->post('customer_id', 0) ?: 0);
        $isEdit     = $request->route('id/d', 0) > 0;

        // 规则 B：发单人已绑定该顾客
        if ($customerId > 0) {
            $customer = TeamCustomerModel::where('id', $customerId)
                ->where('team_id', $team->id)
                ->find();

            if ($customer && (
                (int) ($customer->assignee_entity_id ?? 0) === $entityId
                || TeamCustomerSender::sender($entityId, $customerId)->find()
            )) {
                return $next($request);
            }
        }

        // 规则 C：匿名顾客（仅创建时允许，编辑不允许匿名绕过）
        if (!$isEdit && $customerId === 0) {
            return $next($request);
        }

        throw new HttpException(403, '你无权执行记账操作');
    }
}
