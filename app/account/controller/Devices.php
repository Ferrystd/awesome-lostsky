<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\Device as DeviceService;
use think\Request;

class Devices
{
    protected $middleware = ['JwtAuth', 'Context'];

    /**
     * 退出指定设备（默认当前设备）
     */
    public function quit(Request $request)
    {
        $deviceToken = $request->post('device_token', $request->jwt->dvt ?? '');
        if (empty($deviceToken)) {
            return error('当前会话无关联设备', 1, 400);
        }

        $service = app(DeviceService::class);
        $service->quit($request->user_id, $deviceToken);

        return message('设备已退出');
    }

    /**
     * 退出全部设备
     */
    public function quitAll(Request $request)
    {
        $service = app(DeviceService::class);
        $service->quitAll($request->user_id);

        return message('已退出全部设备');
    }
}
