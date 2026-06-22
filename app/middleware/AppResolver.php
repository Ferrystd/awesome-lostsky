<?php
declare(strict_types=1);

namespace app\middleware;

use Closure;
use think\Request;

/**
 * 在 MultiApp 之前从请求中动态解析 app 名称
 *
 * 方式 1：api.lostsky.work — app 取自 Origin 头域名第二段
 * 方式 2：{slug}.{app}.api.lostsky.work — app 取自 Host 头域名第二段
 */
class AppResolver
{
    public function handle(Request $request, Closure $next)
    {
        $host    = $request->host();
        $apiHost = config('app.domain.api');
        $root    = config('app.domain.root');

        // 方式 1：Host 为 api.lostsky.work，从 Origin 头提取 app
        if ($host === $apiHost) {
            $origin = $request->header('Origin');
            $rootRx = preg_quote($root, '#');
            if ($origin && preg_match("#^https?://[^.]+\.([^.]+)\.{$rootRx}$#", $origin, $m)) {
                app('http')->name($m[1]);
                app('http')->setBind();
            }
        }

        // 方式 2：Host 为 {slug}.{app}.api.lostsky.work，从 Host 提取 app
        if (!$this->bound()) {
            $rootRx2 = preg_quote($root, '/');
            if (preg_match("/^[^.]+\\.([^.]+)\\.api\\.{$rootRx2}$/", $host, $m)) {
                app('http')->name($m[1]);
                app('http')->setBind();
            }
        }

        return $next($request);
    }

    private function bound(): bool
    {
        try {
            return app('http')->isBind();
        } catch (\Throwable) {
            return false;
        }
    }
}
