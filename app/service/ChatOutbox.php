<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatDeliveryStatus;
use app\enum\ChatActorType;
use app\model\ChatConversation;
use app\model\ChatEventOutbox;
use app\model\ChatMessage;
use app\model\ChatParticipant;
use app\model\Entity;
use app\model\ChatWebhookDelivery;
use app\model\TeamVirtual;
use app\model\TeamVirtualIntegration;

class ChatOutbox
{
    private const LEASE_SECONDS = 600;

    public function runOnce(int $limit = 20): array
    {
        $published = 0;
        $failed = 0;
        $eventToken = bin2hex(random_bytes(16));
        $events = $this->claimEvents($limit, $eventToken);
        foreach ($events as $event) {
            try {
                [$conversation, $originIntegrationId] = $this->context($event);
                app(ChatRealtime::class)->publish((string) $conversation->uuid, [
                    'id' => (int) $event->id, 'type' => (string) $event->event_type, 'data' => $event->payload,
                ]);
                $this->prepareDeliveries($event, $conversation, $originIntegrationId);
                $updated = $this->updateClaimedEvent($event, $eventToken, [
                    'published_at' => time(),
                    'last_error' => null,
                    'processing_token' => null,
                    'processing_until' => null,
                ]);
                if ($updated) {
                    $published++;
                }
            } catch (\Throwable $exception) {
                $attempts = (int) $event->attempts + 1;
                $updated = $this->updateClaimedEvent($event, $eventToken, [
                    'attempts' => $attempts,
                    'available_at' => time() + min(3600, 2 ** min($attempts, 10)),
                    'last_error' => mb_substr($exception->getMessage(), 0, 1000),
                    'processing_token' => null,
                    'processing_until' => null,
                ]);
                if ($updated) {
                    $failed++;
                }
            }
        }

        $delivered = $this->deliverPending($limit);
        return compact('published', 'delivered', 'failed');
    }

    private function context(ChatEventOutbox $event): array
    {
        if ((string) $event->aggregate_type === 'message') {
            $message = ChatMessage::find($event->aggregate_id);
            if (!$message) {
                throw new \RuntimeException('事件消息不存在');
            }
            $conversation = ChatConversation::find($message->conversation_id);
            return [$conversation, $message->origin_integration_id ? (int) $message->origin_integration_id : null];
        }
        $conversation = ChatConversation::find($event->aggregate_id);
        if (!$conversation) {
            throw new \RuntimeException('事件会话不存在');
        }
        return [$conversation, null];
    }

    private function prepareDeliveries(
        ChatEventOutbox $event,
        ChatConversation $conversation,
        ?int $originIntegrationId
    ): void {
        $entityIds = ChatParticipant::where('conversation_id', $conversation->id)
            ->whereNull('left_at')->column('entity_id');
        if (!$entityIds) {
            return;
        }
        $virtualIds = Entity::whereIn('id', $entityIds)
            ->where('entityable_type', 'teamVirtual')->column('entityable_id');
        $virtualIds = TeamVirtual::where('team_id', $conversation->team_id)
            ->whereIn('id', $virtualIds)->where('is_active', 1)->column('id');
        if (!$virtualIds) {
            return;
        }
        $integrations = TeamVirtualIntegration::whereIn('virtual_id', $virtualIds)
            ->where('team_id', $conversation->team_id)->where('is_active', 1)->select();
        foreach ($integrations as $integration) {
            if ($originIntegrationId === (int) $integration->id
                || !in_array((string) $event->event_type, (array) ($integration->events ?? []), true)) {
                continue;
            }
            $existing = ChatWebhookDelivery::withTrashed()
                ->where('outbox_id', $event->id)->where('integration_id', $integration->id)->find();
            if ($existing) {
                continue;
            }
            $delivery = app(ChatWebhookDelivery::class, [], true);
            $delivery->save([
                'team_id' => $event->team_id, 'outbox_id' => $event->id,
                'integration_id' => $integration->id, 'status' => ChatDeliveryStatus::Pending,
                'attempts' => 0, 'available_at' => time(),
            ]);
        }
    }

    private function deliverPending(int $limit): int
    {
        $count = 0;
        $deliveryToken = bin2hex(random_bytes(16));
        $rows = $this->claimDeliveries($limit, $deliveryToken);
        foreach ($rows as $delivery) {
            $integration = $delivery->integration;
            $event = $delivery->outbox;
            if (!$integration || !$event || !$integration->is_active) {
                $this->updateClaimedDelivery($delivery, $deliveryToken, [
                    'status' => ChatDeliveryStatus::Failed,
                    'last_error' => '集成或事件不可用',
                    'processing_token' => null,
                    'processing_until' => null,
                ]);
                continue;
            }
            try {
                $body = json_encode([
                    'type' => $event->event_type,
                    'timestamp' => gmdate('Y-m-d\TH:i:s\Z', (int) $event->getData('create_time')),
                    'data' => $event->payload,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
                $timestamp = (string) time();
                $signature = (new \StandardWebhooks\Webhook((string) $integration->signing_secret))
                    ->sign((string) $delivery->id, $timestamp, $body);
                $resolution = app(ChatIntegration::class)->endpointResolution((string) $integration->endpoint_url);
                $response = app(ChatRealtime::class)->request((string) $integration->endpoint_url, $body, [
                    'webhook-id: ' . $delivery->id,
                    'webhook-timestamp: ' . $timestamp,
                    'webhook-signature: ' . $signature,
                ], [$resolution['curl_resolve']]);
                $updated = $this->updateClaimedDelivery($delivery, $deliveryToken, [
                    'status' => ChatDeliveryStatus::Delivered, 'delivered_at' => time(),
                    'response_code' => $response['code'], 'last_error' => null,
                    'processing_token' => null, 'processing_until' => null,
                ]);
                if ($updated) {
                    $count++;
                }
            } catch (\Throwable $exception) {
                $attempts = (int) $delivery->attempts + 1;
                $this->updateClaimedDelivery($delivery, $deliveryToken, [
                    'status' => $attempts >= 6 ? ChatDeliveryStatus::Failed : ChatDeliveryStatus::Pending,
                    'attempts' => $attempts, 'available_at' => time() + min(21600, 5 * (3 ** $attempts)),
                    'last_error' => mb_substr($exception->getMessage(), 0, 1000),
                    'processing_token' => null, 'processing_until' => null,
                ]);
            }
        }
        return $count;
    }

    private function claimEvents(int $limit, string $token)
    {
        $now = time();
        ChatEventOutbox::whereNull('published_at')
            ->where('available_at', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('processing_until')
                    ->whereOr('processing_until', '<', $now);
            })
            ->order('id', 'asc')
            ->limit($limit)
            ->update([
                'processing_token' => $token,
                'processing_until' => $now + self::LEASE_SECONDS,
            ]);

        return ChatEventOutbox::where('processing_token', $token)
            ->whereNull('published_at')
            ->order('id', 'asc')
            ->select();
    }

    private function claimDeliveries(int $limit, string $token)
    {
        $now = time();
        ChatWebhookDelivery::where('status', ChatDeliveryStatus::Pending->value)
            ->where('available_at', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('processing_until')
                    ->whereOr('processing_until', '<', $now);
            })
            ->order('id', 'asc')
            ->limit($limit)
            ->update([
                'processing_token' => $token,
                'processing_until' => $now + self::LEASE_SECONDS,
            ]);

        return ChatWebhookDelivery::where('processing_token', $token)
            ->where('status', ChatDeliveryStatus::Pending->value)
            ->with(['outbox', 'integration'])
            ->order('id', 'asc')
            ->select();
    }

    private function updateClaimedEvent(ChatEventOutbox $event, string $token, array $data): bool
    {
        return ChatEventOutbox::where('id', $event->id)
            ->where('processing_token', $token)
            ->update($data) === 1;
    }

    private function updateClaimedDelivery(ChatWebhookDelivery $delivery, string $token, array $data): bool
    {
        $normalized = $data;
        if (($normalized['status'] ?? null) instanceof ChatDeliveryStatus) {
            $normalized['status'] = $normalized['status']->value;
        }

        return ChatWebhookDelivery::where('id', $delivery->id)
            ->where('processing_token', $token)
            ->update($normalized) === 1;
    }
}
