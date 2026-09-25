<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\Team as TeamService;
use think\Request;

class Team
{
    protected $middleware = ['JwtAuth', 'Context'];

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
     * 生成真实登录用户的个人一次性入队码
     */
    public function joinCode(Request $request)
    {
        $result = app(\app\service\MemberJoinCode::class)->issue($request->user_id);
        return success($result)->header(['Cache-Control' => 'no-store']);
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

}
