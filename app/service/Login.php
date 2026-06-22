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
        if (!$user || $password !== $user->password) {
            throw new HttpException(401, '手机号或密码错误');
        }

        return $this->loginSuccess($user, $deviceInfo);
    }

    /**
     * 用户名/邮箱 + 密码登录
     */
    public function byAccount(string $account, string $password, array $deviceInfo = []): array
    {
        $validator = new LoginValidator;
        if (!$validator->scene('password')->check(['account' => $account, 'password' => $password])) {
            throw new HttpException(422, $validator->getError());
        }

        $user = User::where('username', $account)
            ->whereOr('email', $account)
            ->find();
        if (!$user || $password !== $user->password) {
            throw new HttpException(401, '账号或密码错误');
        }

        return $this->loginSuccess($user, $deviceInfo);
    }

    /**
     * 登录成功：签发 JWT + 记录设备
     */
    public function loginSuccess(User $user, array $deviceInfo): array
    {
        $deviceToken = bin2hex(random_bytes(16));

        $jwt = app(Jwt::class);
        $token = $jwt->createToken($user->id, $deviceToken);

        $device = new UserDevice;
        $device->user_id          = $user->id;
        $device->device_token     = $deviceToken;
        $device->device_name      = $deviceInfo['device_name'] ?? '';
        $device->ua               = $deviceInfo['ua'] ?? '';
        $device->last_active_time = time();
        $device->save();

        return [
            'token' => $token,
            'user'  => $user->visible(['id', 'username', 'phone', 'email'])->toArray(),
        ];
    }
}
