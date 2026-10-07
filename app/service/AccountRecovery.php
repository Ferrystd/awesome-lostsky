<?php
declare(strict_types=1);

namespace app\service;

use app\model\User;
use app\validate\Register as RegisterValidator;
use think\exception\HttpException;
use think\facade\Cache;
use think\facade\Db;

class AccountRecovery
{
    private const TTL = 600;

    /** 验证当前绑定手机号，签发不授予登录权限的十分钟恢复凭据。 */
    public function verify(string $phone, string $code): array
    {
        $this->validate(['phone' => $phone], ['phone']);
        [$user, $version, $generation] = Db::transaction(function () use ($phone): array {
            $user = User::where('phone', $phone)->lock(true)->find();
            $this->assertActive($user);
            $generation = Cache::get($this->generationKey((int) $user->id));
            if (!is_string($generation)) {
                $generation = bin2hex(random_bytes(32));
                if (!Cache::set($this->generationKey((int) $user->id), $generation, self::TTL)) {
                    throw new HttpException(503, '账号恢复暂时不可用，请稍后再试');
                }
            }
            return [$user, $this->version($user), $generation];
        });
        $deadline = time() + self::TTL;
        app(SmsVerification::class)->verify($phone, $code, SmsVerification::PURPOSE_RECOVERY);

        return Db::transaction(function () use ($user, $phone, $version, $generation, $deadline): array {
            $current = User::where('id', $user->id)->lock(true)->find();
            $this->assertActive($current);
            if ($deadline <= time() || $current->phone !== $phone || !hash_equals($version, $this->version($current))
                || Cache::get($this->generationKey((int) $current->id)) !== $generation) $this->invalidToken();
            if (!Cache::set($this->generationKey((int) $current->id), $generation, self::TTL)) {
                throw new HttpException(503, '账号恢复暂时不可用，请稍后再试');
            }
            $token = $current->id . '.' . bin2hex(random_bytes(32));
            $stored = Cache::set($this->key((int) $current->id), [
                'hash' => hash('sha256', $token),
                'version' => $this->version($current),
                'generation' => $generation,
                'expires_at' => time() + self::TTL,
            ], self::TTL);
            if (!$stored) throw new HttpException(503, '账号恢复暂时不可用，请稍后再试');
            return ['recovery_token' => $token, 'expires_in' => self::TTL];
        });
    }

    /** 持有效恢复凭据向尚未注册的新手机号发送专用验证码。 */
    public function sendPhoneSms(string $token, string $phone): array
    {
        $this->validate(['phone' => $phone], ['phone']);
        Db::transaction(function () use ($token, $phone): void {
            $user = $this->lockedUser($token);
            $this->assertNewPhone($user, $phone);
        });
        return app(SmsVerification::class)->send($phone, SmsVerification::PURPOSE_RECOVERY_PHONE);
    }

    /** 重置密码，消费恢复凭据并撤销全部设备、刷新和实体会话。 */
    public function password(string $token, string $password): void
    {
        $this->validate(['password' => $password], ['password']);
        $ids = Db::transaction(function () use ($token, $password): array {
            $user = $this->lockedUser($token);
            // 在用户行锁内先消费；数据库失败也不能重放该凭据。
            $this->consume($user);
            $user->save(['password' => password_hash($password, PASSWORD_DEFAULT)]);
            return app(Device::class)->revokeAll((int) $user->id);
        });
        $this->disconnect($ids);
    }

    /** 核验新手机号后换绑，消费恢复凭据并撤销全部设备会话。 */
    public function phone(string $token, string $phone, string $code): void
    {
        $this->validate(['phone' => $phone], ['phone']);
        // 云端核验在事务外；真正写入前重新锁定用户并验证凭据及占用状态。
        Db::transaction(function () use ($token, $phone): void {
            $this->assertNewPhone($this->lockedUser($token), $phone);
        });
        app(SmsVerification::class)->verify($phone, $code, SmsVerification::PURPOSE_RECOVERY_PHONE);
        try {
            $ids = Db::transaction(function () use ($token, $phone): array {
                $user = $this->lockedUser($token);
                $this->assertNewPhone($user, $phone);
                $this->consume($user);
                $user->save(['phone' => $phone]);
                return app(Device::class)->revokeAll((int) $user->id);
            });
        } catch (\think\db\exception\PDOException $exception) {
            if (($exception->getData()['PDO Error Info']['Driver Error Code'] ?? null) === 1062) {
                throw new HttpException(409, '新手机号已注册');
            }
            throw $exception;
        }
        $this->disconnect($ids);
    }

    private function lockedUser(string $token): User
    {
        if (!preg_match('/^([1-9][0-9]{0,9})\.[a-f0-9]{64}$/D', $token, $matches)) $this->invalidToken();
        $user = User::where('id', (int) $matches[1])->lock(true)->find();
        if (!$user) $this->invalidToken();
        $this->assertActive($user);
        $record = Cache::get($this->key((int) $user->id));
        if (!is_array($record) || ($record['expires_at'] ?? 0) <= time()
            || !hash_equals((string) ($record['hash'] ?? ''), hash('sha256', $token))
            || ($record['generation'] ?? null) !== Cache::get($this->generationKey((int) $user->id))
            || !hash_equals((string) ($record['version'] ?? ''), $this->version($user))) $this->invalidToken();
        return $user;
    }

    private function assertActive(?User $user): void
    {
        if (!$user) throw new HttpException(404, '手机号尚未注册');
        if ((int) $user->is_banned === 1) throw new HttpException(403, '账号已被平台封禁，请联系平台管理员');
    }

    private function assertNewPhone(User $user, string $phone): void
    {
        if ($user->phone === $phone) throw new HttpException(422, '新手机号不能与当前绑定手机号相同');
        if (User::where('phone', $phone)->find()) throw new HttpException(409, '新手机号已注册');
    }

    private function validate(array $data, array $fields): void
    {
        $validator = new RegisterValidator;
        if (!$validator->only($fields)->check($data)) throw new HttpException(422, $validator->getError());
    }

    private function version(User $user): string
    {
        return hash('sha256', $user->phone . '|' . $user->password);
    }

    private function key(int $userId): string
    {
        return 'account_recovery_' . $userId;
    }

    private function consume(User $user): void
    {
        // 留下十分钟随机代际墓碑，阻断尚未发行的旧短信核验在 A→B→A 后复活。
        if (!Cache::set($this->generationKey((int) $user->id), bin2hex(random_bytes(32)), self::TTL)) {
            throw new HttpException(503, '账号恢复暂时不可用，请重新验证当前绑定手机号');
        }
        if (!Cache::delete($this->key((int) $user->id))) {
            throw new HttpException(503, '账号恢复暂时不可用，请重新验证当前绑定手机号');
        }
    }

    private function generationKey(int $userId): string
    {
        return 'account_recovery_generation_' . $userId;
    }

    private function invalidToken(): never
    {
        throw new HttpException(410, '恢复凭据已失效，请重新验证当前绑定手机号');
    }

    private function disconnect(array $ids): void
    {
        foreach ($ids as $id) app(ChatRealtime::class)->disconnectSession($id);
    }
}
