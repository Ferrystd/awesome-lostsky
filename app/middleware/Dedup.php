<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\ApiRequestCache;
use think\exception\HttpException;
use think\Request;
use think\Response;

/**
 * 防重复提交 / 防重放攻击 中间件
 *
 * 优先使用 X-Request-Id 防重放；旧客户端仍可通过 X-Page-Id + 请求内容防重复提交。
 *
 * 非网页请求（缺少 X-Request-Id 和 X-Page-Id）直接放行，不做拦截。
 */
class Dedup
{
    public function handle(Request $request, \Closure $next)
    {
        $pageId    = trim((string) $request->header('X-Page-Id'));
        $requestId = trim((string) $request->header('X-Request-Id'));

        if ($this->shouldPass($request, $pageId, $requestId)) {
            return $next($request);
        }

        $hash = $this->buildHash($request, $pageId, $requestId);

        // 概率性清理过期记录，避免额外定时任务
        $this->randomCleanup();
        $this->forgetExpiredHash($hash);

        // 检查是否已存在（重复提交/重放）
        if ($this->hasHash($hash)) {
            throw new HttpException(429, '请勿重复提交');
        }

        // 存储哈希
        $cache = new ApiRequestCache();
        $cache->hash = $hash;
        $cache->save();

        try {
            $response = $next($request);
        } catch (\Throwable $e) {
            $this->forgetHash($hash);
            throw $e;
        }

        if (!$this->isSuccessfulResponse($response)) {
            $this->forgetHash($hash);
        }

        return $response;
    }

    /**
     * 构建请求哈希
     */
    private function buildHash(Request $request, string $pageId, string $requestId): string
    {
        $raw = $requestId !== ''
            ? implode('|', [$request->url(), $request->method(), $requestId])
            : implode('|', [
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

    private function shouldPass(Request $request, string $pageId, string $requestId): bool
    {
        if ($pageId === '' && $requestId === '') {
            return true;
        }

        return in_array($request->method(true), ['OPTIONS', 'GET', 'HEAD'], true);
    }

    private function isSuccessfulResponse(Response $response): bool
    {
        if ($response->getCode() >= 400) {
            return false;
        }

        $data = $response->getData();
        if (is_array($data) && array_key_exists('code', $data)) {
            return (int) $data['code'] === 0;
        }

        return true;
    }

    private function hasHash(string $hash): bool
    {
        $expire = config('dedup.expire_seconds', 300);

        return (bool) ApiRequestCache::where('hash', $hash)
            ->where('create_time', '>=', time() - $expire)
            ->find();
    }

    private function forgetHash(string $hash): void
    {
        ApiRequestCache::where('hash', $hash)->delete();
    }

    private function forgetExpiredHash(string $hash): void
    {
        $expire = config('dedup.expire_seconds', 300);

        ApiRequestCache::where('hash', $hash)
            ->where('create_time', '<', time() - $expire)
            ->delete();
    }
}
