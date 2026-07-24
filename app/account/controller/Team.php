<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\Team as TeamService;
use think\Request;

class Team
{
    protected $middleware = ['JwtAuth', 'Context', 'EntityType:teamless'];

    /**
     * 获取当前用户的所有团队
     */
    public function index(Request $request)
    {
        $service = app(TeamService::class);
        $result  = $service->list($request->user_id);

        return success($result);
    }

    /**
     * 新增团队
     */
    public function add(Request $request)
    {
        $slug        = $request->post('slug', '');
        $displayName = $request->post('display_name', '');

        $service = app(TeamService::class);
        $result  = $service->create($request->user_id, $slug, $displayName);

        return success($result);
    }

    /**
     * 删除团队
     */
    public function delete(Request $request)
    {
        $teamId = (int) $request->post('team_id', 0);

        $service = app(TeamService::class);
        $service->delete($request->user_id, $teamId);

        return message('团队已删除');
    }
}
