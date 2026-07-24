<?php
declare (strict_types = 1);

namespace app\middleware;

class ChatAccess
{
    /**
     * 处理请求
     *
     * @param \think\Request $request
     * @param \Closure       $next
     * @return Response
     */
    public function handle(\think\Request $request, \Closure $next)
    {
        if ($request->acting_entity) {
            return $next($request);
        }

        $member = $request->member ?? null;
        $customer = $request->customer ?? null;
        $memberAllowed = $member && !(bool) $member->is_blocked;
        $customerAllowed = $customer && !(bool) $customer->is_blocked;
        if (!$memberAllowed && !$customerAllowed) {
            throw new \think\exception\HttpException(403, '你不是该团队的成员或客户');
        }

        return $next($request);
    }
}
