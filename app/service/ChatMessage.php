<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatActorType;
use app\enum\ChatConversationKind;
use app\enum\ChatGroupHistory;
use app\model\ChatMessage as ChatMessageModel;
use app\model\ChatParticipant;
use think\exception\HttpException;

class ChatMessage
{
    public function list(int $teamId, string $uuid, int $memberId, int $customerId, int $beforeId = 0, int $limit = 50): array
    {
        $conversation = app(ChatConversation::class)->model($teamId, $uuid, true);
        app(ChatConversation::class)->assertAccess($conversation, $teamId, $memberId, $customerId);
        $query = ChatMessageModel::where('conversation_id', $conversation->id);
        if ($conversation->enumCase('kind') === ChatConversationKind::Group) {
            $settings = app(TeamSetting::class)->internal($teamId, 'chat');
            if (($settings['group_history'] ?? ChatGroupHistory::FromJoin->value)
                === ChatGroupHistory::FromJoin->value) {
                $query->where('create_time', '>=', $this->eligibleJoinTime(
                    $conversation->participants,
                    $teamId,
                    $memberId,
                    $customerId
                ));
            }
        }
        if ($beforeId > 0) {
            $query->where('id', '<', $beforeId);
        }
        $limit = max(1, min(100, $limit));
        $rows = $query->with(['reply'])->order('id', 'desc')->limit($limit)->select()->all();
        $rows = array_reverse($rows);
        return array_map(fn ($message) => $this->summary($message), $rows);
    }

    public function send(int $teamId, int $memberId, int $customerId, array $data, ?int $integrationId = null): array
    {
        $data['content'] = trim((string) ($data['content'] ?? ''));
        $this->validate('send', $data);
        $conversation = app(ChatConversation::class)->model($teamId, (string) $data['conversation'], true);
        if ($conversation->is_closed) {
            throw new HttpException(409, '会话已经关闭');
        }

        $actor = app(ChatActor::class)->resolve($teamId, (string) $data['actor_slug']);
        if ($integrationId === null) {
            app(ChatActor::class)->assertCanAct($actor, $teamId, $memberId, $customerId);
        }
        $participant = ChatParticipant::where('conversation_id', $conversation->id)
            ->where('actor_type', $actor['type']->value)->where('actor_id', $actor['id'])
            ->whereNull('left_at')->find();
        if (!$participant) {
            throw new HttpException(403, '该身份不是会话参与者');
        }

        $replyId = !empty($data['reply_id']) ? (int) $data['reply_id'] : null;
        if ($replyId && !ChatMessageModel::where('conversation_id', $conversation->id)->find($replyId)) {
            throw new HttpException(422, '回复的消息不属于当前会话');
        }

        $message = null;
        \think\facade\Db::transaction(function () use (&$message, $teamId, $conversation, $actor, $data, $replyId, $integrationId) {
            $message = app(ChatMessageModel::class, [], true);
            $message->save([
                'team_id' => $teamId, 'conversation_id' => $conversation->id,
                'sender_type' => $actor['type'], 'sender_id' => $actor['id'], 'reply_id' => $replyId,
                'origin_integration_id' => $integrationId, 'content' => $data['content'],
            ]);
            $conversation->save(['last_message_id' => $message->id, 'last_message_at' => time()]);
            $this->outbox($teamId, 'message.created', (int) $message->id, $this->summary($message));
        });

        return $this->summary($message);
    }

    public function edit(int $teamId, int $memberId, int $customerId, int $messageId, string $content): void
    {
        $content = trim($content);
        $this->validate('edit', ['message_id' => $messageId, 'content' => $content]);
        $message = $this->message($teamId, $messageId);
        $this->assertMessageAction($message, $teamId, $memberId, $customerId, 'edit');
        if ($message->revoked_at) {
            throw new HttpException(409, '已撤回消息不能编辑');
        }
        \think\facade\Db::transaction(function () use ($message, $content, $teamId, $messageId) {
            $message->save(['content' => $content, 'edited_at' => time()]);
            $this->outbox($teamId, 'message.updated', $messageId, $this->summary($message));
        });
    }

    public function revoke(int $teamId, int $memberId, int $customerId, int $messageId): void
    {
        $message = $this->message($teamId, $messageId);
        $this->assertMessageAction($message, $teamId, $memberId, $customerId, 'revoke');
        if ($message->revoked_at) {
            return;
        }
        \think\facade\Db::transaction(function () use ($message, $teamId, $messageId) {
            $message->save(['content' => null, 'revoked_at' => time()]);
            $this->outbox($teamId, 'message.revoked', $messageId, $this->summary($message));
        });
    }

    public function read(int $teamId, string $uuid, string $actorSlug, int $memberId, int $customerId, int $messageId): void
    {
        $conversation = app(ChatConversation::class)->model($teamId, $uuid, true);
        app(ChatConversation::class)->assertAccess($conversation, $teamId, $memberId, $customerId);
        $actor = app(ChatActor::class)->resolve($teamId, $actorSlug);
        app(ChatActor::class)->assertCanAct($actor, $teamId, $memberId, $customerId);
        $participant = ChatParticipant::where('conversation_id', $conversation->id)
            ->where('actor_type', $actor['type']->value)->where('actor_id', $actor['id'])
            ->whereNull('left_at')->find();
        if (!$participant) {
            throw new HttpException(403, '该身份不是会话参与者');
        }
        if (!ChatMessageModel::where('conversation_id', $conversation->id)->find($messageId)) {
            throw new HttpException(422, '已读消息不属于当前会话');
        }
        $settings = app(TeamSetting::class)->internal($teamId, 'chat');
        if ((string) ($settings['read_receipts'] ?? '1') !== '1') {
            return;
        }
        if ((int) ($participant->last_read_message_id ?? 0) < $messageId) {
            $participant->save(['last_read_message_id' => $messageId]);
        }
    }

    private function assertMessageAction(ChatMessageModel $message, int $teamId, int $memberId, int $customerId, string $action): void
    {
        $summary = app(ChatActor::class)->summary($message->enumCase('sender_type'), (int) $message->sender_id);
        $actor = !empty($summary['slug']) ? app(ChatActor::class)->resolve($teamId, (string) $summary['slug']) : null;
        $own = $actor && app(ChatActor::class)->canAct($actor, $teamId, $memberId, $customerId);
        if (!$own && !app(PermissionGate::class)->allows($teamId, $memberId, ['chat.message.moderate'])) {
            throw new HttpException(403, '你不能操作该消息');
        }
        if ($own) {
            $settings = app(TeamSetting::class)->internal($teamId, 'chat');
            $minutes = (int) ($settings[$action === 'edit' ? 'edit_window_minutes' : 'revoke_window_minutes'] ?? 0);
            $createdAt = (int) $message->getData('create_time');
            if ($minutes <= 0 || $createdAt + $minutes * 60 < time()) {
                throw new HttpException(409, '消息操作窗口已结束');
            }
        }
    }

    private function message(int $teamId, int $messageId): ChatMessageModel
    {
        $message = ChatMessageModel::where('team_id', $teamId)->find($messageId);
        if (!$message) {
            throw new HttpException(404, '消息不存在');
        }
        return $message;
    }

    private function summary(ChatMessageModel $message): array
    {
        return [
            'id' => (int) $message->id,
            'conversation' => (string) ($message->conversation?->uuid ?? ''),
            'sender' => app(ChatActor::class)->summary($message->enumCase('sender_type'), (int) $message->sender_id),
            'content' => $message->content, 'reply_id' => $message->reply_id,
            'edited_at' => $message->edited_at, 'revoked_at' => $message->revoked_at,
            'create_time' => (int) $message->getData('create_time'),
        ];
    }

    private function eligibleJoinTime(
        iterable $participants,
        int $teamId,
        int $memberId,
        int $customerId
    ): int {
        $joinedAt = [];
        foreach ($participants as $participant) {
            if ($participant->left_at) {
                continue;
            }
            $type = $participant->enumCase('actor_type');
            $eligible = match ($type) {
                ChatActorType::Member => (int) $participant->actor_id === $memberId,
                ChatActorType::Customer => (int) $participant->actor_id === $customerId,
                ChatActorType::Virtual => $this->canOperateVirtual(
                    $teamId,
                    $memberId,
                    (int) $participant->actor_id
                ),
            };
            if ($eligible) {
                $joinedAt[] = (int) $participant->joined_at;
            }
        }
        return $joinedAt ? min($joinedAt) : time();
    }

    private function canOperateVirtual(int $teamId, int $memberId, int $virtualId): bool
    {
        $summary = app(ChatActor::class)->summary(ChatActorType::Virtual, $virtualId);
        $slug = (string) ($summary['slug'] ?? '');
        return $slug !== '' && app(PermissionGate::class)->allows($teamId, $memberId, [
            'chat.virtual.*.operate',
            "chat.virtual.{$slug}.operate",
        ]);
    }

    private function outbox(int $teamId, string $eventType, int $id, array $payload): void
    {
        $event = app(\app\model\ChatEventOutbox::class, [], true);
        $event->save([
            'team_id' => $teamId, 'event_type' => $eventType, 'aggregate_type' => 'message',
            'aggregate_id' => $id, 'payload' => $payload, 'attempts' => 0, 'available_at' => time(),
        ]);
    }

    private function validate(string $scene, array $data): void
    {
        $validator = new \app\validate\ChatMessage;
        if (!$validator->scene($scene)->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
