<?php
use app\model\Team;
use app\model\TeamDomain;

$request = request();
$host    = $request->host();
$root    = config('app.domain.root');                  // lostsky.work
$apiHost = config('app.domain.api');                   // api.lostsky.work
$rootRx = preg_quote($root, '/');                    // lostsky\.work

// 方式 2：{slug}.{app}.api.lostsky.work — slug 取自 Host 头域名
if (!isset($request->team) && preg_match("/^([^.]+)\.[^.]+\.api\.{$rootRx}$/", $host, $m)) {
    bindTeam($m[1]);
}

// 方式 1：api.lostsky.work — slug 取自 Origin 头（用户浏览器域名 {slug}.{app}.lostsky.work）
if (!isset($request->team) && $host === $apiHost) {
    $origin = $request->header('Origin');
    $rootRx2 = preg_quote($root, '#');               // lostsky\.work
    if ($origin && preg_match("#^https?://([^.]+)\.[^.]+\.{$rootRx2}$#", $origin, $m)) {
        bindTeam($m[1]);
    }
}

// 方式 3：自定义域名 — 从 team_domain 表反查
if (!isset($request->team) && !str_contains($host, $root)) {
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

function bindTeam(string $slug): void
{
    $team = Team::active()->cache("team_slug_{$slug}", 3600)->where('slug', $slug)->find();
    if ($team) {
        $request = request();
        $request->team    = $team;
        $request->team_id = (int) $team->id;
        $request->slug    = $slug;
    }
}
