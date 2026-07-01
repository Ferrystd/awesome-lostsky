<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\Team;
use app\model\TeamDomain;
use Closure;
use think\Request;

/**
 * 在 MultiApp 之前从请求中动态解析 app 名称 + 绑定团队上下文
 *
 * 方式 1：api.lostsky.work — app/slug 取自 Origin 头域名
 * 方式 2：{slug}.{app}.api.lostsky.work — app/slug 取自 Host 头域名
 * 方式 3：自定义域名 — 从 team_domain 表反查
 */
class AppResolver
{
    public function handle(Request $request, Closure $next)
    {
        $host    = $request->host();
        $apiHost = config('app.domain.api');
        $root    = config('app.domain.root');

        // 方式 1：Host 为 api.lostsky.work，从 Origin 头提取 app 和 slug
        if ($host === $apiHost) {
            $origin = $request->header('Origin');
            $rootRx = preg_quote($root, '#');
            // 匹配 https://{slug}.{app}.lostsky.work
            if ($origin && preg_match("#^https?://([^.]+)\\.([^.]+)\\.{$rootRx}$#", $origin, $m)) {
                $slug = $m[1];
                $app  = $m[2];
                app('http')->name($app);
                app('http')->setBind();
                $this->bindTeam($request, $slug);
            }
        } else {
            // 方式 2：Host 为 {slug}.{app}.api.lostsky.work，从 Host 提取 app 和 slug
            if (!$this->bound()) {
                $rootRx2 = preg_quote($root, '/');
                if (preg_match("/^([^.]+)\\.([^.]+)\\.api\\.{$rootRx2}$/", $host, $m)) {
                    $slug = $m[1];
                    $app  = $m[2];
                    app('http')->name($app);
                    app('http')->setBind();
                    $this->bindTeam($request, $slug);
                }
            }
        }

        // 方式 3：自定义域名 — 从 team_domain 表反查
        // 在所有方式之后尝试，确保即使前两种未匹配也能尝试绑定
        if (!isset($request->team) && !str_contains($host, $root)) {
            $this->bindTeamByDomain($request, $host);
        }

        return $next($request);
    }

    /**
     * 根据 slug 绑定团队到请求上下文
     */
    private function bindTeam(Request $request, string $slug): void
    {
        $team = Team::active()->cache("team_slug_{$slug}", 3600)->where('slug', $slug)->find();
        if ($team) {
            $request->team    = $team;
            $request->team_id = (int) $team->id;
            $request->slug    = $slug;
        }
    }

    /**
     * 根据自定义域名绑定团队
     */
    private function bindTeamByDomain(Request $request, string $host): void
    {
        $domain = TeamDomain::cache('team_domain_' . md5($host), 3600)->where('domain', $host)->find();
        if ($domain) {
            $team = Team::active()->cache('team_id_' . $domain->team_id, 3600)->find($domain->team_id);
            if ($team) {
                $request->team    = $team;
                $request->team_id = (int) $team->id;
                $request->slug    = $team->slug;
            }
        }
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
