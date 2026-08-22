<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\AbilityCatalog;
use think\Request;

final class Teams
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_TEAM_READ => ['only' => ['index', 'get']],
        'AdminPermission:' . Permissions::ADMIN_TEAM_MODERATE => ['only' => ['ban', 'unban']],
        'AdminPermission:' . Permissions::ADMIN_TEAM_ABILITY_WRITE => ['only' => ['abilityCatalog', 'grantAbility']],
    ];

    public function index(Request $request)
    {
        return success(app(\app\service\PlatformAdmin::class)->teams([
            'q' => $request->get('q/s', ''),
            'status' => $request->get('status/s', ''),
            'page' => $request->get('page/d', 1),
            'limit' => $request->get('limit/d', 20),
        ]));
    }

    public function get(Request $request)
    {
        return success(app(\app\service\PlatformAdmin::class)->team($request->route('id/d')));
    }

    public function ban(Request $request)
    {
        return $this->moderate($request, true);
    }

    public function unban(Request $request)
    {
        return $this->moderate($request, false);
    }

    public function grantAbility(Request $request)
    {
        return success(app(\app\service\PlatformAdmin::class)->grantTeamAbilityBySlug(
            $request->user_id,
            $request->post('team_slug/s', ''),
            $request->post('ability_key/s', ''),
            $request->post('level/d', 0),
            $request->post('expire_time/d', 0),
            $request
        ), '团队能力已开通');
    }

    public function abilityCatalog()
    {
        return success(AbilityCatalog::all());
    }

    private function moderate(Request $request, bool $banned)
    {
        app(\app\service\PlatformAdmin::class)->moderateTeam(
            $request->user_id,
            $request->route('id/d'),
            $banned,
            $request->post('reason/s', ''),
            $request
        );
        return message($banned ? '团队已封禁' : '团队已解封');
    }
}
