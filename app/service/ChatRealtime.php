<?php
declare(strict_types=1);

namespace app\service;

use Firebase\JWT\JWT;
use think\exception\HttpException;

class ChatRealtime
{
    public function connectionToken(int $userId): array
    {
        if ($userId < 1) {
            throw new HttpException(401, '登录状态无效');
        }
        $secret = $this->tokenSecret();
        $now = time();
        $token = JWT::encode([
            'sub' => "user:{$userId}", 'iat' => $now, 'exp' => $now + 300,
        ], $secret, 'HS256');
        $url = trim((string) config('centrifugo.client_url'));
        if ($url === '') {
            throw new \RuntimeException('Centrifugo 客户端地址尚未配置');
        }
        return ['token' => $token, 'url' => $url];
    }

    public function subscriptionToken(
        int $teamId,
        int $userId,
        int $memberId,
        int $customerId,
        string $uuid
    ): array {
        $conversation = app(ChatConversation::class)->model($teamId, $uuid, true);
        app(ChatConversation::class)->assertAccess($conversation, $teamId, $memberId, $customerId);
        $channel = $this->channel($uuid);
        $now = time();
        $token = JWT::encode([
            'sub' => "user:{$userId}", 'channel' => $channel, 'iat' => $now, 'exp' => $now + 300,
        ], $this->tokenSecret(), 'HS256');
        return compact('token', 'channel');
    }

    public function publish(string $uuid, array $event): void
    {
        $url = rtrim((string) config('centrifugo.api_url'), '/') . '/api/publish';
        $key = (string) config('centrifugo.api_key');
        if ($url === '/api/publish' || $key === '') {
            throw new \RuntimeException('Centrifugo尚未配置');
        }
        $this->request($url, json_encode([
            'channel' => $this->channel($uuid), 'data' => $event,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), ['X-API-Key: ' . $key]);
    }

    public function request(string $url, string $body, array $headers = [], array $resolve = []): array
    {
        $curl = curl_init($url);
        if ($curl === false) {
            throw new \RuntimeException('无法初始化 HTTP 请求');
        }
        $options = [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => 10, CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
        ];
        if ($resolve) {
            $options[CURLOPT_RESOLVE] = $resolve;
            $options[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
        }
        curl_setopt_array($curl, $options);
        $response = curl_exec($curl);
        $code = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($response === false || $code < 200 || $code >= 300) {
            throw new \RuntimeException($error ?: "HTTP请求失败：{$code}");
        }
        return ['code' => $code, 'body' => (string) $response];
    }

    private function channel(string $uuid): string
    {
        return 'chat:conversation:' . strtolower(trim($uuid));
    }

    private function tokenSecret(): string
    {
        $secret = (string) config('centrifugo.token_secret');
        if (strlen($secret) < 32) {
            throw new \RuntimeException('Centrifugo 令牌密钥尚未配置或长度不足');
        }
        return $secret;
    }
}
