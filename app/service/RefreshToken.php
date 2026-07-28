<?php
declare(strict_types=1);

namespace app\service;

use app\model\UserDevice;
use app\model\UserRefreshToken;
use think\exception\HttpException;
use think\facade\Db;

class RefreshToken
{
    private const ROTATION_GRACE_SECONDS = 10;

    public function issue(UserDevice $device, ?string $familyId = null): array
    {
        $plain = bin2hex(random_bytes(32));
        $expiresAt = time() + max(60, (int) config('jwt.refresh_ttl'));

        $token = new UserRefreshToken;
        $token->save([
            'user_id' => (int) $device->user_id,
            'device_id' => (int) $device->id,
            'family_id' => $familyId ?: bin2hex(random_bytes(16)),
            'token_hash' => hash('sha256', $plain),
            'expires_at' => $expiresAt,
        ]);

        return [
            'plain' => $plain,
            'model' => $token,
            'expires_at' => $expiresAt,
        ];
    }

    public function rotate(string $plain): array
    {
        if (!preg_match('/^[a-f0-9]{64}$/', $plain)) {
            throw new HttpException(401, '刷新令牌无效');
        }

        $result = Db::transaction(function () use ($plain): array {
            $current = UserRefreshToken::where('token_hash', hash('sha256', $plain))
                ->lock(true)
                ->find();

            if (!$current || $current->revoked_at || (int) $current->expires_at <= time()) {
                return ['status' => 401];
            }

            $device = UserDevice::where('id', $current->device_id)
                ->where('user_id', $current->user_id)
                ->lock(true)
                ->find();
            if (!$device) {
                return ['status' => 401];
            }

            if ($current->used_at) {
                if ((int) $current->used_at + self::ROTATION_GRACE_SECONDS >= time()) {
                    return ['status' => 409];
                }

                UserRefreshToken::where('family_id', $current->family_id)
                    ->whereNull('revoked_at')
                    ->update(['revoked_at' => time()]);
                $device->delete();

                return ['status' => 401];
            }

            $issued = $this->issue($device, (string) $current->family_id);
            $current->used_at = time();
            $current->replacement_id = (int) $issued['model']->id;
            $current->save();
            $device->last_active_time = time();
            $device->save();

            return [
                'status' => 200,
                'token' => app(Jwt::class)->createToken(
                    (int) $device->user_id,
                    (string) $device->device_token
                ),
                'refresh_token' => $issued['plain'],
                'refresh_expires_at' => $issued['expires_at'],
            ];
        });

        if ($result['status'] === 409) {
            throw new HttpException(409, '刷新令牌已轮换，请使用最新令牌重试');
        }
        if ($result['status'] !== 200) {
            throw new HttpException(401, '刷新令牌无效或已撤销');
        }

        return [
            'token' => $result['token'],
            'refresh_token' => $result['refresh_token'],
            'refresh_expires_at' => $result['refresh_expires_at'],
        ];
    }

    public function revokeDevice(int $userId, int $deviceId): void
    {
        UserRefreshToken::where('user_id', $userId)
            ->where('device_id', $deviceId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => time()]);
    }
}
