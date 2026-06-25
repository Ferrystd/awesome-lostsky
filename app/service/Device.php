<?php
declare(strict_types=1);

namespace app\service;

use app\model\UserDevice;
use think\exception\HttpException;

class Device
{
    /**
     * 退出指定设备
     */
    public function quit(int $userId, string $deviceToken): void
    {
        $device = UserDevice::where('user_id', $userId)
            ->where('device_token', $deviceToken)
            ->find();

        if (!$device) {
            throw new HttpException(404, '设备不存在');
        }

        $device->delete();
    }

    /**
     * 退出全部设备
     */
    public function quitAll(int $userId): void
    {
        $devices = UserDevice::where('user_id', $userId)->select();
        foreach ($devices as $device) {
            $device->delete();
        }
    }
}
