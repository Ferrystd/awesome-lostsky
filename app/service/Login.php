<?php
declare(strict_types=1);

namespace app\service;

use app\model\User;
use app\model\UserDevice;
use app\validate\Login as LoginValidator;
use think\exception\HttpException;

class Login
{
    /**
     * 手机号 + 密码登录
     */
    public function byPhone(string $phone, string $password, array $deviceInfo = []): array
    {
        $validator = new LoginValidator;
        if (!$validator->scene('phone')->check(['phone' => $phone, 'password' => $password])) {
            throw new HttpException(422, $validator->getError());
        }

        $user = User::where('phone', $phone)->find();
        if (!$user || !$this->verifyPassword($user, $password)) {
            throw new HttpException(401, '手机号或密码错误');
        }
        $this->assertActive($user);

        return $this->loginSuccess($user, $deviceInfo);
    }

    /**
     * 手机号 + 短信验证码登录
     */
    public function bySms(string $phone, string $code, array $deviceInfo = []): array
    {
        app(SmsVerification::class)->verify($phone, $code, SmsVerification::PURPOSE_LOGIN);

        $user = User::where('phone', $phone)->find();
        if (!$user) {
            throw new HttpException(404, '手机号尚未注册');
        }
        $this->assertActive($user);

        return $this->loginSuccess($user, $deviceInfo);
    }

    /**
     * 手机号/用户名/邮箱 + 密码登录
     */
    public function byAccount(string $account, string $password, array $deviceInfo = []): array
    {
        $validator = new LoginValidator;
        if (!$validator->scene('password')->check(['account' => $account, 'password' => $password])) {
            throw new HttpException(422, $validator->getError());
        }

        $user = User::where('username', $account)
            ->whereOr('email', $account)
            ->whereOr('phone', $account)
            ->find();
        if (!$user || !$this->verifyPassword($user, $password)) {
            throw new HttpException(401, '账号或密码错误');
        }
        $this->assertActive($user);

        return $this->loginSuccess($user, $deviceInfo);
    }

    /**
     * 登录成功：签发 JWT + 记录设备
     */
    public function loginSuccess(User $user, array $deviceInfo): array
    {
        $deviceToken = bin2hex(random_bytes(16));

        $issued = \think\facade\Db::transaction(function () use ($user, $deviceToken, $deviceInfo): array {
            $lockedUser = User::where('id', $user->id)->lock(true)->find();
            if (!$lockedUser) {
                throw new HttpException(401, '当前账号不存在');
            }
            $this->assertActive($lockedUser);

            $device = new UserDevice;
            $device->user_id          = $lockedUser->id;
            $device->device_token     = $deviceToken;
            $device->device_name      = $deviceInfo['device_name'] ?? '';
            $device->ua               = $deviceInfo['ua'] ?? '';
            $device->last_active_time = time();
            $device->save();

            $issued = app(RefreshToken::class)->issue($device);
            $issued['token'] = app(Jwt::class)->createToken((int) $lockedUser->id, $deviceToken);

            return $issued;
        });

        return [
            'token' => $issued['token'],
            'refresh_token' => $issued['plain'],
            'refresh_expires_at' => $issued['expires_at'],
            'user' => $user->visible(['id', 'username', 'phone', 'email'])->toArray(),
        ];
    }

    public function refresh(string $refreshToken): array
    {
        return app(RefreshToken::class)->rotate($refreshToken);
    }

    private function verifyPassword(User $user, string $password): bool
    {
        $stored = (string) $user->password;
        if (password_verify($password, $stored)) {
            if (password_needs_rehash($stored, PASSWORD_DEFAULT)) {
                $user->password = password_hash($password, PASSWORD_DEFAULT);
                $user->save();
            }
            return true;
        }

        // 兼容开发阶段遗留的明文密码；首次成功登录后立即迁移为哈希。
        if ($stored !== '' && hash_equals($stored, $password)) {
            $user->password = password_hash($password, PASSWORD_DEFAULT);
            $user->save();
            return true;
        }

        return false;
    }

    private function assertActive(User $user): void
    {
        if ((int) $user->is_banned === 1) {
            throw new HttpException(403, '账号已被平台封禁，请联系平台管理员');
        }
    }
}
