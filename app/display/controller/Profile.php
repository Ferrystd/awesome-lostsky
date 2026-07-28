<?php
declare(strict_types=1);

namespace app\display\controller;

use app\service\Display as DisplayService;
use think\Request;

class Profile
{
    /**
     * 获取团队公开资料
     */
    public function get(Request $request)
    {
        $service = app(DisplayService::class);
        $result  = $service->profile((int) $request->team_id);

        return success($result);
    }
}
