<?php
declare(strict_types=1);

namespace app\service;

use app\model\EntitySession;
use app\model\User;
use app\model\UserDevice;
use think\exception\HttpException;
use think\facade\Db;

class Device
{
    /**
     * 退出指定设备
     */
    public function quit(int $userId, string $deviceToken): void
    {
        $ids = Db::transaction(function () use ($userId, $deviceToken): array {
            User::where('id', $userId)->lock(true)->find();
            $device = UserDevice::where('user_id', $userId)
                ->where('device_token', $deviceToken)->lock(true)->find();
            if (!$device) {
                throw new HttpException(404, '设备不存在');
            }
            return $this->revoke($device);
        });
        foreach ($ids as $id) {
            app(ChatRealtime::class)->disconnectSession($id);
        }
    }

    /**
     * 退出全部设备
     */
    public function quitAll(int $userId): void
    {
        $ids = $this->revokeAll($userId);
        foreach ($ids as $id) {
            app(ChatRealtime::class)->disconnectSession($id);
        }
    }

    /**
     * 只撤销数据库授权；调用者在最外层事务提交后断开返回的会话。
     */
    public function revokeAll(int $userId): array
    {
        return Db::transaction(function () use ($userId): array {
            User::where('id', $userId)->lock(true)->find();
            $devices = UserDevice::where('user_id', $userId)->order('id')->lock(true)->select();
            $ids = [];
            foreach ($devices as $device) {
                $ids = array_merge($ids, $this->revoke($device));
            }
            return $ids;
        });
    }

    private function revoke(UserDevice $device): array
    {
        app(RefreshToken::class)->revokeDevice((int) $device->user_id, (int) $device->id);
        $sessions = EntitySession::where('user_id', $device->user_id)
            ->where('device_token', $device->device_token)
            ->whereNull('revoked_at')->order('id')->lock(true)->select();
        $ids = [];
        foreach ($sessions as $session) {
            $ids[] = (int) $session->id;
            $session->save(['revoked_at' => time()]);
        }
        $device->delete();
        return $ids;
    }
}