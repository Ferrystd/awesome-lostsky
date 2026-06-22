<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamMember as TeamMemberService;
use think\Request;

class Me
{
    protected $middleware = ['JwtAuth', 'Context', 'MemberAccess'];

    /**
     * 获取自己在团队内的完整资料
     */
    public function get(Request $request)
    {
        $service = app(TeamMemberService::class);
        $result  = $service->get($request->team_id, $request->member_id);

        return success($result);
    }

    /**
     * 编辑自己在团队内的资料
     */
    public function edit(Request $request)
    {
        $data = [];
        if ($request->has('nickname')) {
            $data['nickname'] = $request->post('nickname', '');
        }
        if ($request->has('avatar')) {
            $data['avatar'] = $request->post('avatar', '');
        }

        $service = app(TeamMemberService::class);
        $service->edit($request->team_id, $request->member_id, $data);

        return message('资料已更新');
    }
}
