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
 *   B. 发单人已绑定该客户
 *   C. 匿名客户（walk-in）
 */
class TransactionVerify
{
    public function handle(Request $request, \Closure $next)
    {
        $team = $request->team ?? null;
        $actingEntity = ($request->acting_entity ?? []);
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        if (!$team || $entityId < 1) {
            throw new HttpException(403, '当前实体无效');
        }

        // 规则 A：团队实体
        if (($actingEntity['type'] ?? '') === 'team') {
            return $next($request);
        }

        $customerId = (int) ($request->post('customer_id', 0) ?: 0);
        $isEdit     = $request->route('id/d', 0) > 0;

        // 规则 B：发单人已绑定该客户
        if ($customerId > 0) {
            $customer = TeamCustomerModel::where('id', $customerId)
                ->where('team_id', $team->id)
                ->find();

            if ($customer && TeamCustomerSender::sender($entityId, $customerId)->find()) {
                return $next($request);
            }
        }

        // 规则 C：匿名客户（仅创建时允许，编辑不允许匿名绕过）
        if (!$isEdit && $customerId === 0) {
            return $next($request);
        }

        throw new HttpException(403, '你无权执行记账操作');
    }
}
