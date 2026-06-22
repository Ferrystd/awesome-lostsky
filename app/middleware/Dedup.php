<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\ApiRequestCache;
use think\exception\HttpException;
use think\Request;

/**
 * 防重复提交 / 防重放攻击 中间件
 *
 * 依赖前端在页面加载时生成 UUID，通过 X-Page-Id 请求头携带。
 * 同一页面内完全相同的请求（url + method + data + pageId）在有效期内只允许通过一次。
 *
 * 非网页请求（缺少 X-Page-Id）直接放行，不做拦截。
 */
class Dedup
{
    public function handle(Request $request, \Closure $next)
    {
        $pageId = $request->header('X-Page-Id');

        // 非网页请求（无 pageId），直接放行
        if (empty($pageId)) {
            return $next($request);
        }

        $hash = $this->buildHash($request, $pageId);

        // 检查是否已存在（重复提交/重放）
        if (ApiRequestCache::where('hash', $hash)->find()) {
            throw new HttpException(429, '请勿重复提交');
        }

        // 存储哈希
        $cache = new ApiRequestCache();
        $cache->hash = $hash;
        $cache->save();

        // 概率性清理过期记录，避免额外定时任务
        $this->randomCleanup();

        return $next($request);
    }

    /**
     * 构建请求哈希
     */
    private function buildHash(Request $request, string $pageId): string
    {
        $raw = implode('|', [
            $request->url(),
            $request->method(),
            json_encode($request->param(), JSON_UNESCAPED_UNICODE),
            $pageId,
        ]);

        return md5($raw);
    }

    /**
     * 概率性清理过期哈希
     * 避免数据库无限膨胀，同时无需引入定时任务
     */
    private function randomCleanup(): void
    {
        $prob = config('dedup.cleanup_probability', 100);

        if (mt_rand(1, $prob) !== 1) {
            return;
        }

        $expire = config('dedup.expire_seconds', 300);

        ApiRequestCache::where('create_time', '<', time() - $expire)->delete();
    }
}
