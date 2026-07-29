<?php
declare(strict_types=1);

namespace app\middleware;

use think\exception\HttpException;
use think\Request;

/**
 * 限制当前请求允许使用的实体身份类型。
 *
 * teamless 仅表示没有显式 acting_entity 的基础用户 JWT，不是持久化实体类型。
 * 依赖 JwtAuth、Context 已运行；多个参数或逗号分隔参数按 OR 处理。
 */
class EntityType
{
    private const TYPES = ['teamless', 'team', 'teamMember', 'teamCustomer', 'teamVirtual'];

    public function handle(Request $request, \Closure $next, string ...$allowedTypes)
    {
        if (($request->authenticated_user_id ?? 0) < 1) {
            throw new HttpException(500, 'EntityType 中间件必须在 Context 之后运行');
        }

        $allowed = $this->allowedTypes($allowedTypes);
        $acting = $request->acting_entity ?? null;
        $actual = is_array($acting) ? (string) ($acting['type'] ?? '') : 'teamless';

        if (!in_array($actual, $allowed, true)) {
            throw new HttpException(403, '当前身份类型不能访问此接口');
        }

        return $next($request);
    }

    private function allowedTypes(array $arguments): array
    {
        if (!$arguments) {
            throw new HttpException(500, 'EntityType 中间件至少需要一个实体类型参数');
        }

        $allowed = [];
        foreach ($arguments as $argument) {
            foreach (explode(',', $argument) as $type) {
                $type = trim($type);
                if ($type === '' || !in_array($type, self::TYPES, true)) {
                    throw new HttpException(500, 'EntityType 中间件包含无效实体类型');
                }
                $allowed[] = $type;
            }
        }

        return array_values(array_unique($allowed));
    }
}
