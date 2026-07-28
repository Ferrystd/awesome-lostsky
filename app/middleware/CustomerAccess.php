<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

class CustomerAccess
{
    public function handle(Request $request, \Closure $next)
    {
        $acting = $request->acting_entity ?? null;
        if (!is_array($acting)
            || ($acting['type'] ?? '') !== 'teamCustomer'
            || (int) ($acting['id'] ?? 0) !== (int) ($request->customer_id ?? 0)) {
            throw new HttpException(403, '当前实体不是该团队客户');
        }

        $customer = $request->customer ?? null;

        if (!$customer) {
            throw new HttpException(403, '你不是该团队的顾客');
        }

        if ($customer->is_blocked) {
            throw new HttpException(403, '你已被该团队封禁');
        }

        return $next($request);
    }
}
