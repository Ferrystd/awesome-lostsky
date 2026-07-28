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
 *   member/customer — 当前 acting entity 对应的业务主体（可能为 null）
 *
 * 只做提取，不做鉴权。实体资格与业务权限由后续中间件校验。
 */
class Context
{
    public function handle(Request $request, \Closure $next)
    {
        $request->authenticated_user_id = (int) ($request->jwt->uid ?? 0);
        $request->user_id = $request->authenticated_user_id;
        if ($request->entity_session) {
            $entity = $request->entity_session->subject;
            if (!$entity) {
                throw new \think\exception\HttpException(401, '实体会话无效');
            }
            $request->acting_entity = [
                'entity_id' => (int) $entity->id,
                'type' => (string) $entity->entityable_type,
                'id' => (int) $entity->entityable_id,
            ];
            $request->entity_id = $request->acting_entity['entity_id'];
        }

        $team = $request->team ?? null;

        if ($team) {
            $request->team_id = (int) $team->id;

            $acting = $request->acting_entity ?? null;
            if (is_array($acting) && ($acting['type'] ?? '') === 'teamMember') {
                $member = TeamMemberModel::where('team_id', $team->id)
                    ->where('id', (int) ($acting['id'] ?? 0))
                    ->find();
                if ($member) {
                    $request->member = $member;
                    $request->member_id = (int) $member->id;
                }
            } elseif (is_array($acting) && ($acting['type'] ?? '') === 'teamCustomer') {
                $customer = TeamCustomerModel::inTeam((int) $team->id)
                    ->where('id', (int) ($acting['id'] ?? 0))
                    ->with(['profile', 'balance'])
                    ->find();
                if ($customer) {
                    $request->customer = $customer;
                    $request->customer_id = (int) $customer->id;
                }
            }
        }

        return $next($request);
    }
}
