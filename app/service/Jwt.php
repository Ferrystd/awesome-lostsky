<?php
declare(strict_types=1);

namespace app\service;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use think\facade\Config;

/**
 * JWT 服务
 */
class Jwt
{
    /**
     * 生成 Token
     */
    public function createToken(int $uid, string $deviceToken = '', array $extra = [], ?int $expiresAt = null): string
    {
        $config = $this->config();
        if ($uid < 1 || $deviceToken === '') {
            throw new \RuntimeException('JWT 用户或设备信息不完整');
        }
        $now    = time();

        $payload = array_merge([
            'iss' => $config['iss'],
            'iat' => $now,
            'exp' => $expiresAt ?? ($now + $config['ttl']),
            'uid' => $uid,
            'dvt' => $deviceToken,
        ], array_intersect_key($extra, array_flip(['aud', 'jti', 'act'])));

        return FirebaseJWT::encode($payload, $config['secret'], $config['algo']);
    }

    /**
     * 解析 Token
     */
    public function parseToken(string $token): object
    {
        $config = $this->config();
        FirebaseJWT::$leeway = max(0, (int) $config['leeway']);
        $key    = new Key($config['secret'], $config['algo']);

        return FirebaseJWT::decode($token, $key);
    }

    /**
     * 验证 Token 是否有效
     */
    public function validate(string $token): bool
    {
        try {
            $this->parseToken($token);
            return true;
        } catch (ExpiredException $e) {
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function config(): array
    {
        $config = Config::get('jwt');
        $secret = (string) ($config['secret'] ?? '');
        if (strlen($secret) < 32
            || hash_equals('lostsky_jwt_secret_default_change_in_production', $secret)) {
            throw new \RuntimeException('JWT 密钥未配置或长度不足');
        }

        $algorithm = (string) ($config['algo'] ?? '');
        if (!in_array($algorithm, ['HS256', 'HS384', 'HS512'], true)) {
            throw new \RuntimeException('JWT 算法配置无效');
        }

        return $config;
    }
}
