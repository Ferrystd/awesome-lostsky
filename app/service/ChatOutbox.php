<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatDeliveryStatus;
use app\enum\ChatActorType;
use app\model\ChatConversation;
use app\model\ChatEventOutbox;
use app\model\ChatMessage;
use app\model\ChatParticipant;
use app\model\ChatWebhookDelivery;
use app\model\TeamVirtual;
use app\model\TeamVirtualIntegration;

class ChatOutbox
{
    public function runOnce(int $limit = 20): array
    {
        $published = 0;
        $failed = 0;
        $events = ChatEventOutbox::whereNull('published_at')
            ->where('available_at', '<=', time())->order('id', 'asc')->limit($limit)->select();
        foreach ($events as $event) {
            try {
                [$conversation, $originIntegrationId] = $this->context($event);
                app(ChatRealtime::class)->publish((string) $conversation->uuid, [
                    'id' => (int) $event->id, 'type' => (string) $event->event_type, 'data' => $event->payload,
                ]);
                $this->prepareDeliveries($event, $conversation, $originIntegrationId);
                $event->save(['published_at' => time(), 'last_error' => null]);
                $published++;
            } catch (\Throwable $exception) {
                $attempts = (int) $event->attempts + 1;
                $event->save([
                    'attempts' => $attempts,
                    'available_at' => time() + min(3600, 2 ** min($attempts, 10)),
                    'last_error' => mb_substr($exception->getMessage(), 0, 1000),
                ]);
                $failed++;
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
        $virtualIds = ChatParticipant::where('conversation_id', $conversation->id)
            ->where('actor_type', ChatActorType::Virtual->value)->whereNull('left_at')->column('actor_id');
        if (!$virtualIds) {
            return;
        }
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
        $rows = ChatWebhookDelivery::where('status', ChatDeliveryStatus::Pending->value)
            ->where('available_at', '<=', time())->with(['outbox', 'integration'])
            ->order('id', 'asc')->limit($limit)->select();
        foreach ($rows as $delivery) {
            $integration = $delivery->integration;
            $event = $delivery->outbox;
            if (!$integration || !$event || !$integration->is_active) {
                $delivery->save(['status' => ChatDeliveryStatus::Failed, 'last_error' => '集成或事件不可用']);
                continue;
            }
            $body = json_encode([
                'delivery_id' => (int) $delivery->id, 'event' => $event->event_type,
                'created_at' => (int) $event->getData('create_time'), 'data' => $event->payload,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $timestamp = (string) time();
            $signature = hash_hmac('sha256', "{$timestamp}.{$delivery->id}.{$body}", (string) $integration->signing_secret);
            try {
                $resolution = app(ChatIntegration::class)->endpointResolution((string) $integration->endpoint_url);
                $response = app(ChatRealtime::class)->request((string) $integration->endpoint_url, $body, [
                    'X-LostSky-Delivery: ' . $delivery->id,
                    'X-LostSky-Timestamp: ' . $timestamp,
                    'X-LostSky-Signature: sha256=' . $signature,
                ], [$resolution['curl_resolve']]);
                $delivery->save([
                    'status' => ChatDeliveryStatus::Delivered, 'delivered_at' => time(),
                    'response_code' => $response['code'], 'last_error' => null,
                ]);
                $count++;
            } catch (\Throwable $exception) {
                $attempts = (int) $delivery->attempts + 1;
                $delivery->save([
                    'status' => $attempts >= 6 ? ChatDeliveryStatus::Failed : ChatDeliveryStatus::Pending,
                    'attempts' => $attempts, 'available_at' => time() + min(21600, 5 * (3 ** $attempts)),
                    'last_error' => mb_substr($exception->getMessage(), 0, 1000),
                ]);
            }
        }
        return $count;
    }
}
