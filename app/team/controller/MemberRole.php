<?php
declare(strict_types=1);

namespace app\team\controller;

use think\Request;

class MemberRole
{
    protected $middleware = ['JwtAuth', 'Context', 'TeamAccess'];

    public function index(Request $request)
    {
        $memberId = (int) $request->param('member_id', 0);

        return success(app(\app\service\MemberRole::class)->list($request->team_id, $memberId));
    }

    public function save(Request $request)
    {
        app(\app\service\MemberRole::class)->save(
            $request->team_id,
            (int) $request->post('member_id', 0),
            $request->post('role_ids')
        );

        return message('成员角色已更新');
    }
}
