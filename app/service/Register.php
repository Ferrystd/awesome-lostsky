<?php
declare(strict_types=1);

namespace app\service;

use app\model\User;
use app\model\UserProfile;
use app\validate\Register as RegisterValidator;
use think\exception\HttpException;

class Register
{
    /**
     * 手机号注册
     */
    public function phone(string $phone, string $password, array $deviceInfo = []): array
    {
        $validator = new RegisterValidator;
        if (!$validator->check(['phone' => $phone, 'password' => $password])) {
            throw new HttpException(422, $validator->getError());
        }

        if (User::where('phone', $phone)->find()) {
            throw new HttpException(409, '手机号已注册');
        }

        $user = \app\model\Base::transaction(function () use ($phone, $password) {
            $user = new User;
            $user->phone    = $phone;
            $user->password = $password;
            $user->username = 'user_' . bin2hex(random_bytes(4));
            $user->save();

            $profile = new UserProfile;
            $profile->user_id = $user->id;
            $profile->save();

            return $user;
        });

        $login = app(Login::class);
        return $login->loginSuccess($user, $deviceInfo);
    }
}
