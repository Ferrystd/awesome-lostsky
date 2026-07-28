<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamVirtualIntegration;
use app\model\TeamVirtual;
use think\exception\HttpException;

class ChatIntegration
{
    private const EVENTS = [
        'conversation.created',
        'conversation.closed',
        'conversation.participants.added',
        'conversation.participant.removed',
        'message.created',
        'message.updated',
        'message.revoked',
    ];

    public function create(int $teamId, string $slug, array $data): array
    {
        $this->validate('create', $data);
        $this->endpointResolution((string) $data['endpoint_url']);
        $events = $this->events($data['events'] ?? ['message.created']);
        $virtual = app(ChatVirtual::class)->model($teamId, $slug);
        $token = bin2hex(random_bytes(32));
        $secret = bin2hex(random_bytes(32));

        $integration = app(TeamVirtualIntegration::class, [], true);
        $integration->save([
            'team_id' => $teamId, 'virtual_id' => $virtual->id, 'name' => $data['name'],
            'driver' => 'webhook', 'endpoint_url' => $data['endpoint_url'], 'events' => $events,
            'token_hash' => hash('sha256', $token), 'signing_secret' => $secret, 'is_active' => 1,
        ]);

        return ['id' => (int) $integration->id, 'token' => $token, 'signing_secret' => $secret];
    }

    public function update(int $teamId, string $slug, int $id, array $data): void
    {
        $this->validate('update', $data);
        if (isset($data['endpoint_url'])) {
            $this->endpointResolution((string) $data['endpoint_url']);
        }
        if (array_key_exists('events', $data)) {
            $data['events'] = $this->events($data['events']);
        }
        $allow = array_intersect_key($data, array_flip(['name', 'endpoint_url', 'events', 'is_active']));
        if ($allow) {
            $this->integration($teamId, $slug, $id)->save($allow);
        }
    }

    public function rotate(int $teamId, string $slug, int $id): array
    {
        $integration = $this->integration($teamId, $slug, $id);
        $token = bin2hex(random_bytes(32));
        $secret = bin2hex(random_bytes(32));
        $integration->save(['token_hash' => hash('sha256', $token), 'signing_secret' => $secret]);
        return ['token' => $token, 'signing_secret' => $secret];
    }

    public function delete(int $teamId, string $slug, int $id): void
    {
        $this->integration($teamId, $slug, $id)->delete();
    }

    public function authenticate(string $token): TeamVirtualIntegration
    {
        $hash = hash('sha256', trim($token));
        $integration = TeamVirtualIntegration::where('token_hash', $hash)->where('is_active', 1)->find();
        if (!$integration || !hash_equals((string) $integration->token_hash, $hash)) {
            throw new HttpException(401, '集成令牌无效');
        }
        return $integration;
    }

    public function authenticateActor(string $token): array
    {
        $integration = $this->authenticate($token);
        $virtual = TeamVirtual::with(['identity'])
            ->where('team_id', $integration->team_id)
            ->find($integration->virtual_id);
        if (!$virtual || !$virtual->slug) {
            throw new HttpException(401, '集成对应的虚拟实体不可用');
        }

        return ['integration' => $integration, 'virtual' => $virtual];
    }

    private function integration(int $teamId, string $slug, int $id): TeamVirtualIntegration
    {
        $virtual = app(ChatVirtual::class)->model($teamId, $slug);
        $integration = TeamVirtualIntegration::where('team_id', $teamId)
            ->where('virtual_id', $virtual->id)->find($id);
        if (!$integration) {
            throw new HttpException(404, '虚拟实体集成不存在');
        }
        return $integration;
    }

    private function events($events): array
    {
        if (!is_array($events)) {
            throw new HttpException(422, '事件列表格式不正确');
        }
        $events = array_values(array_unique(array_map('strval', $events)));
        foreach ($events as $event) {
            if (!in_array($event, self::EVENTS, true)) {
                throw new HttpException(422, "不支持的事件：{$event}");
            }
        }
        return $events;
    }

    public function endpointResolution(string $url): array
    {
        $parts = parse_url($url);
        if (!$parts || strtolower((string) ($parts['scheme'] ?? '')) !== 'https' || empty($parts['host'])) {
            throw new HttpException(422, 'Webhook必须使用有效的HTTPS地址');
        }
        $host = strtolower((string) $parts['host']);
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);
        if (!$ips) {
            throw new HttpException(422, 'Webhook域名无法解析');
        }
        foreach ($ips as $ip) {
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                throw new HttpException(422, 'Webhook不能指向内网或保留地址');
            }
        }
        $port = isset($parts['port']) ? (int) $parts['port'] : 443;
        $ip = $ips[array_rand($ips)];
        return [
            'host' => $host,
            'port' => $port,
            'ip' => $ip,
            'curl_resolve' => "{$host}:{$port}:{$ip}",
        ];
    }

    private function validate(string $scene, array $data): void
    {
        $validator = new \app\validate\ChatIntegration;
        if (!$validator->scene($scene)->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
