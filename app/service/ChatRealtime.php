<?php
declare(strict_types=1);

namespace app\service;

use Firebase\JWT\JWT;
use think\exception\HttpException;

class ChatRealtime
{
    public function connectionToken(int $sessionId, array $actingEntity, int $expectedEntityId): array
    {
        app(ChatIdentity::class)->expected($actingEntity, $expectedEntityId);
        if ($sessionId < 1) throw new HttpException(401, '人员会话无效');
        $secret = $this->tokenSecret();
        $now = time();
        $token = JWT::encode([
            'sub' => $this->subject($sessionId), 'entity_id' => (int) $actingEntity['entity_id'], 'iat' => $now, 'exp' => $now + 300,
        ], $secret, 'HS256');
        $url = trim((string) config('centrifugo.client_url'));
        if ($url === '') {
            throw new \RuntimeException('Centrifugo 顾客端地址尚未配置');
        }
        return ['token' => $token, 'url' => $url];
    }

    public function subscriptionToken(
        int $sessionId,
        array $actingEntity,
        int $expectedEntityId,
        string $uuid
    ): array {
        app(ChatIdentity::class)->expected($actingEntity, $expectedEntityId);
        $conversation = app(ChatConversation::class)->model($uuid, true);
        app(ChatConversation::class)->assertAccess($conversation, $actingEntity);
        $channel = $this->channel((string) $conversation->uuid, (int) $actingEntity['entity_id'], $sessionId);
        $now = time();
        $token = JWT::encode([
            'sub' => $this->subject($sessionId), 'entity_id' => (int) $actingEntity['entity_id'], 'channel' => $channel, 'iat' => $now, 'exp' => $now + 300,
        ], $this->tokenSecret(), 'HS256');
        return compact('token', 'channel');
    }

    public function publishToRecipients(string $uuid, array $event, array $entityIds): void
    {
        $entityIds = array_values(array_unique(array_filter(array_map('intval', $entityIds))));
        foreach ($entityIds as $entityId) {
            foreach ($this->activeSessions($entityId) as $session) {
                $this->publishChannel($this->channel($uuid, $entityId, (int) $session->id), $event);
            }
        }
    }

    public function unsubscribeEntity(int $entityId, string $uuid): void
    {
        foreach ($this->activeSessions($entityId) as $session) {
            $id = (int) $session->id;
            $this->serverCommand('unsubscribe', ['user' => $this->subject($id), 'channel' => $this->channel($uuid, $entityId, $id)]);
        }
    }

    public function disconnectSession(int $sessionId): void
    {
        if ($sessionId > 0) $this->serverCommand('disconnect', ['user' => $this->subject($sessionId)]);
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
        unset($curl);
        if ($response === false || $code < 200 || $code >= 300) {
            throw new \RuntimeException($error ?: "HTTP请求失败：{$code}");
        }
        return ['code' => $code, 'body' => (string) $response];
    }

    private function channel(string $uuid, int $entityId, int $sessionId): string
    {
        return 'chat.conversation.' . strtolower(trim($uuid)) . ".entity.{$entityId}.session.{$sessionId}";
    }

    private function publishChannel(string $channel, array $event): void
    {
        $url = rtrim((string) config('centrifugo.api_url'), '/') . '/api/publish';
        $key = (string) config('centrifugo.api_key');
        if ($url === '/api/publish' || $key === '') throw new \RuntimeException('Centrifugo尚未配置');
        $this->request($url, json_encode(['channel'=>$channel,'data'=>$event], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES), ['X-API-Key: '.$key]);
    }

    private function subject(int $sessionId): string { return "entity-session:{$sessionId}"; }

    private function activeSessions(int $entityId): array
    {
        $entity = \app\model\Entity::find($entityId);
        if (!$entity || !$entity->is_valid) return [];
        $valid = [];
        foreach (\app\model\EntitySession::where('entity_id', $entityId)->whereNull('revoked_at')
            ->whereNull('superseded_at')->where('expires_at', '>', time())->select() as $session) {
            try {
                app(IdentitySession::class)->session((int)$session->user_id,(string)$session->device_token,
                    (string)$session->getData('jti'),(string)$entity->entityable_type,(int)$entity->entityable_id);
                $valid[] = $session;
            } catch (\Throwable) {}
        }
        return $valid;
    }

    private function serverCommand(string $method, array $payload): void
    {
        $url = rtrim((string) config('centrifugo.api_url'), '/') . '/api/' . $method;
        $key = (string) config('centrifugo.api_key');
        if ($url === "/api/{$method}" || $key === '') return;
        try { $this->request($url, json_encode($payload, JSON_UNESCAPED_SLASHES), ['X-API-Key: '.$key]); }
        catch (\Throwable $e) { trace("Centrifugo {$method} failed: {$e->getMessage()}", 'error'); }
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
