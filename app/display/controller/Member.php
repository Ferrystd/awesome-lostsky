<?php
declare(strict_types=1);

namespace app\display\controller;

use app\service\Display as DisplayService;
use think\Request;

class Member
{
    /**
     * 获取可展示的成员列表
     */
    public function index(Request $request)
    {
        $service = app(DisplayService::class);
        $result  = $service->members($request->team_id);

        return success($result);
    }

    /**
     * 获取单个可展示的成员详情
     */
    public function get(Request $request)
    {
        $memberId = (int) $request->param('member_id', 0);

        $service = app(DisplayService::class);
        $result  = $service->member($request->team_id, $memberId);

        return success($result);
    }
}
