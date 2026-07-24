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
    public function createToken(int $uid, string $deviceToken = '', array $extra = []): string
    {
        $config = Config::get('jwt');
        $now    = time();

        $payload = array_merge([
            'iss' => $config['iss'],
            'iat' => $now,
            'exp' => $now + $config['ttl'],
            'uid' => $uid,
            'dvt' => $deviceToken,
        ], $extra);

        return FirebaseJWT::encode($payload, $config['secret'], $config['algo']);
    }

    /**
     * 解析 Token
     */
    public function parseToken(string $token): object
    {
        $config = Config::get('jwt');
        $key    = new Key($config['secret'], $config['algo']);

        return FirebaseJWT::decode($token, $key);
    }

    /**
     * 刷新 Token
     */
    public function refreshToken(string $token): string
    {
        $config  = Config::get('jwt');
        $decoded = $this->parseToken($token);
        $now     = time();

        if ($decoded->iat + $config['refresh_ttl'] < $now) {
            throw new \RuntimeException('Token 已过期，无法刷新');
        }

        $extra = [];
        if (isset($decoded->aud)) $extra['aud'] = $decoded->aud;
        if (isset($decoded->jti)) $extra['jti'] = $decoded->jti;
        if (isset($decoded->act)) $extra['act'] = (array) $decoded->act;
        return $this->createToken($decoded->uid, $decoded->dvt ?? '', $extra);
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
}
