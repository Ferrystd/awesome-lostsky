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
 * 缺少客户端标识时仍按请求主体、路径和内容生成服务端防重键。
 */
class Dedup
{
    public function handle(Request $request, \Closure $next)
    {
        $pageId    = trim((string) $request->header('X-Page-Id'));
        $requestId = trim((string) $request->header('X-Request-Id'));

        if ($this->shouldPass($request)) {
            return $next($request);
        }
        $this->validateIdentifiers($pageId, $requestId);

        $hash = $this->buildHash($request, $pageId, $requestId);

        // 概率性清理过期记录，避免额外定时任务
        $this->randomCleanup();
        $this->forgetExpiredHash($hash);

        $this->reserve($hash);

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
        $principal = hash('sha256', (string) $request->header('Authorization'));
        $raw = $requestId !== ''
            ? implode('|', [$request->url(), $request->method(), $principal, $requestId])
            : ($pageId !== '' ? implode('|', [
                $request->url(),
                $request->method(),
                $principal,
                json_encode($request->param(), JSON_UNESCAPED_UNICODE),
                $pageId,
            ]) : implode('|', [
                $request->url(),
                $request->method(),
                $principal,
                json_encode($request->param(), JSON_UNESCAPED_UNICODE),
            ]));

        return hash('sha256', $raw);
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

    private function shouldPass(Request $request): bool
    {
        return in_array($request->method(true), ['OPTIONS', 'GET', 'HEAD'], true);
    }

    private function validateIdentifiers(string $pageId, string $requestId): void
    {
        foreach ([$pageId, $requestId] as $identifier) {
            if ($identifier !== '' && (strlen($identifier) > 128
                || !preg_match('/^[A-Za-z0-9._:-]+$/', $identifier))) {
                throw new HttpException(422, '请求幂等标识格式不正确');
            }
        }
    }

    private function reserve(string $hash): void
    {
        for ($attempt = 0; $attempt < 2; $attempt++) {
            $this->forgetExpiredHash($hash);
            try {
                $cache = new ApiRequestCache();
                $cache->hash = $hash;
                $cache->save();
                return;
            } catch (\Throwable $exception) {
                if ($this->hasHash($hash)) {
                    throw new HttpException(429, '请勿重复提交');
                }
                if ($attempt === 1) {
                    throw $exception;
                }
            }
        }
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
