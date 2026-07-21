<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatActorType;
use app\enum\ChatConversationKind;
use app\enum\ChatCustomerGroupMode;
use app\model\ChatConversation as ChatConversationModel;
use app\model\ChatParticipant;
use think\exception\HttpException;

class ChatConversation
{
    public function list(int $teamId, int $memberId, int $customerId): array
    {
        $showReadReceipts = $this->showReadReceipts($teamId);
        $rows = ChatConversationModel::where('team_id', $teamId)
            ->with(['participants'])
            ->order('last_message_at', 'desc')
            ->order('id', 'desc')
            ->select();
        $result = [];
        foreach ($rows as $conversation) {
            if ($this->canAccess($conversation, $teamId, $memberId, $customerId)) {
                $result[] = $this->summary($conversation, $showReadReceipts);
            }
        }
        return $result;
    }

    public function get(int $teamId, string $uuid, int $memberId, int $customerId): array
    {
        $conversation = $this->conversation($teamId, $uuid, true);
        $this->assertAccess($conversation, $teamId, $memberId, $customerId);
        return $this->summary($conversation, $this->showReadReceipts($teamId));
    }

    public function create(int $teamId, int $memberId, int $customerId, array $data): array
    {
        $this->validate($data);
        $actors = app(ChatActor::class);
        $creator = $actors->resolve($teamId, (string) $data['actor_slug']);
        $actors->assertCanAct($creator, $teamId, $memberId, $customerId);

        $participants = [$creator['slug'] => $creator];
        foreach ($data['participants'] as $participant) {
            $slug = is_array($participant) ? (string) ($participant['slug'] ?? '') : (string) $participant;
            $actor = $actors->resolve($teamId, $slug);
            $participants[$actor['slug']] = $actor;
        }

        $kind = ChatConversationKind::from((string) $data['kind']);
        if ($kind === ChatConversationKind::Direct && count($participants) !== 2) {
            throw new HttpException(422, '单聊必须且只能包含两个参与者');
        }
        if ($kind === ChatConversationKind::Group && count($participants) < 2) {
            throw new HttpException(422, '群聊至少需要两个参与者');
        }
        $temporary = (int) ($data['is_temporary'] ?? 0) === 1;
        $this->assertCanCreate($creator, $teamId, $memberId, $kind, $temporary);
        $this->assertParticipantPolicy($teamId, $participants, $creator, $kind);
        if (!$temporary && !empty($data['expires_at'])) {
            throw new HttpException(422, '只有临时会话可以设置到期时间');
        }
        if ($temporary && !empty($data['expires_at']) && (int) $data['expires_at'] <= time()) {
            throw new HttpException(422, '临时会话到期时间必须晚于当前时间');
        }
        $directKey = $kind === ChatConversationKind::Direct && !$temporary
            ? $this->directKey($teamId, array_values($participants))
            : null;

        if ($directKey) {
            $existing = ChatConversationModel::where('direct_key', $directKey)->find();
            if ($existing) {
                return ['uuid' => $existing->uuid, 'existing' => true];
            }
        }

        $uuid = $this->uuid();
        try {
            \think\facade\Db::transaction(function () use ($teamId, $data, $kind, $temporary, $directKey, $creator, $participants, $uuid) {
                $conversation = app(ChatConversationModel::class, [], true);
                $conversation->save([
                    'team_id' => $teamId, 'uuid' => $uuid, 'kind' => $kind,
                    'title' => $kind === ChatConversationKind::Group
                        ? (trim((string) ($data['title'] ?? '')) ?: null)
                        : null,
                    'direct_key' => $directKey, 'is_temporary' => $temporary ? 1 : 0,
                    'created_by_type' => $creator['type'], 'created_by_id' => $creator['id'],
                    'expires_at' => !empty($data['expires_at']) ? (int) $data['expires_at'] : null,
                ]);
                foreach ($participants as $actor) {
                    $participant = app(ChatParticipant::class, [], true);
                    $participant->save([
                        'team_id' => $teamId, 'conversation_id' => $conversation->id,
                        'actor_type' => $actor['type'], 'actor_id' => $actor['id'], 'joined_at' => time(),
                    ]);
                }
                $this->outbox($teamId, 'conversation.created', (int) $conversation->id, [
                    'conversation' => $uuid, 'kind' => $kind->value,
                ]);
            });
        } catch (\Throwable $exception) {
            if ($directKey) {
                $existing = ChatConversationModel::where('direct_key', $directKey)->find();
                if ($existing) {
                    return ['uuid' => $existing->uuid, 'existing' => true];
                }
            }
            throw $exception;
        }

        return ['uuid' => $uuid, 'existing' => false];
    }

    public function close(int $teamId, string $uuid, int $memberId, int $customerId): void
    {
        $conversation = $this->conversation($teamId, $uuid, true);
        $this->assertAccess($conversation, $teamId, $memberId, $customerId);
        if ($conversation->is_closed) {
            return;
        }
        $creatorSummary = app(ChatActor::class)->summary(
            $conversation->enumCase('created_by_type'),
            (int) $conversation->created_by_id
        );
        $creator = !empty($creatorSummary['slug'])
            ? app(ChatActor::class)->resolve($teamId, (string) $creatorSummary['slug'])
            : null;
        $canCreatorAct = $creator && app(ChatActor::class)->canAct($creator, $teamId, $memberId, $customerId);
        $canManage = app(PermissionGate::class)->allows($teamId, $memberId, ['chat.group.manage']);
        if (!$canCreatorAct && !$canManage) {
            throw new HttpException(403, '你不能关闭该会话');
        }
        \think\facade\Db::transaction(function () use ($conversation, $teamId, $uuid) {
            $conversation->save(['closed_at' => time()]);
            $this->outbox($teamId, 'conversation.closed', (int) $conversation->id, ['conversation' => $uuid]);
        });
    }

    public function addParticipants(
        int $teamId,
        string $uuid,
        int $memberId,
        int $customerId,
        array $slugs
    ): void {
        $conversation = $this->conversation($teamId, $uuid, true);
        $this->assertGroupManager($conversation, $teamId, $memberId, $customerId);
        if ($conversation->is_closed) {
            throw new HttpException(409, '会话已经关闭');
        }

        $actors = [];
        foreach (array_values(array_unique(array_map('strval', $slugs))) as $slug) {
            $actor = app(ChatActor::class)->resolve($teamId, $slug);
            $actors[$actor['slug']] = $actor;
        }
        if (!$actors) {
            throw new HttpException(422, '请至少选择一个参与者');
        }
        $this->assertParticipantPolicy($teamId, $actors, null, ChatConversationKind::Group);

        \think\facade\Db::transaction(function () use ($teamId, $conversation, $actors, $uuid) {
            foreach ($actors as $actor) {
                $participant = ChatParticipant::withTrashed()
                    ->where('conversation_id', $conversation->id)
                    ->where('actor_type', $actor['type']->value)
                    ->where('actor_id', $actor['id'])
                    ->find();
                if ($participant && !$participant->left_at && !$participant->trashed()) {
                    continue;
                }
                if (!$participant) {
                    $participant = app(ChatParticipant::class, [], true);
                }
                $participant->save([
                    'team_id' => $teamId,
                    'conversation_id' => $conversation->id,
                    'actor_type' => $actor['type'],
                    'actor_id' => $actor['id'],
                    'joined_at' => time(),
                    'left_at' => null,
                    'last_read_message_id' => null,
                    'delete_time' => null,
                ]);
            }
            $this->outbox($teamId, 'conversation.participants.added', (int) $conversation->id, [
                'conversation' => $uuid,
                'participants' => array_map(
                    fn (array $actor): array => app(ChatActor::class)->summary($actor['type'], $actor['id']),
                    array_values($actors)
                ),
            ]);
        });
    }

    public function removeParticipant(
        int $teamId,
        string $uuid,
        int $memberId,
        int $customerId,
        string $slug
    ): void {
        $conversation = $this->conversation($teamId, $uuid, true);
        $this->assertGroupManager($conversation, $teamId, $memberId, $customerId);
        $actor = app(ChatActor::class)->resolve($teamId, $slug);
        $participant = ChatParticipant::where('conversation_id', $conversation->id)
            ->where('actor_type', $actor['type']->value)
            ->where('actor_id', $actor['id'])
            ->whereNull('left_at')
            ->find();
        if (!$participant) {
            throw new HttpException(404, '参与者不在当前群聊中');
        }
        $activeCount = ChatParticipant::where('conversation_id', $conversation->id)
            ->whereNull('left_at')
            ->count();
        if ($activeCount <= 2) {
            throw new HttpException(422, '群聊至少需要保留两个参与者');
        }

        \think\facade\Db::transaction(function () use ($participant, $teamId, $conversation, $uuid, $actor) {
            $participant->save(['left_at' => time()]);
            $this->outbox($teamId, 'conversation.participant.removed', (int) $conversation->id, [
                'conversation' => $uuid,
                'participant' => app(ChatActor::class)->summary($actor['type'], $actor['id']),
            ]);
        });
    }

    public function model(int $teamId, string $uuid, bool $withParticipants = false): ChatConversationModel
    {
        return $this->conversation($teamId, $uuid, $withParticipants);
    }

    public function assertAccess(ChatConversationModel $conversation, int $teamId, int $memberId, int $customerId): void
    {
        if (!$this->canAccess($conversation, $teamId, $memberId, $customerId)) {
            throw new HttpException(403, '你不是该会话的参与者');
        }
    }

    public function canAccess(ChatConversationModel $conversation, int $teamId, int $memberId, int $customerId): bool
    {
        $participants = $conversation->participants;
        foreach ($participants as $participant) {
            $type = $participant->enumCase('actor_type');
            if ($participant->left_at) {
                continue;
            }
            if ($type === ChatActorType::Member && (int) $participant->actor_id === $memberId) {
                return true;
            }
            if ($type === ChatActorType::Customer && (int) $participant->actor_id === $customerId) {
                return true;
            }
            if ($type === ChatActorType::Virtual) {
                $summary = app(ChatActor::class)->summary($type, (int) $participant->actor_id);
                $slug = (string) ($summary['slug'] ?? '');
                if ($slug !== '' && app(PermissionGate::class)->allows($teamId, $memberId, [
                    'chat.virtual.*.operate', "chat.virtual.{$slug}.operate",
                ])) {
                    return true;
                }
            }
        }
        return false;
    }

    private function summary(ChatConversationModel $conversation, bool $showReadReceipts): array
    {
        $participants = $conversation->participants;
        return [
            'uuid' => $conversation->uuid,
            'kind' => $conversation->enumCase('kind')->value,
            'title' => $conversation->title,
            'is_temporary' => (bool) $conversation->is_temporary,
            'is_closed' => $conversation->is_closed,
            'expires_at' => $conversation->expires_at,
            'last_message_at' => $conversation->last_message_at,
            'last_message' => $conversation->lastMessage?->content,
            'participants' => array_map(fn ($participant) => array_merge(
                app(ChatActor::class)->summary($participant->enumCase('actor_type'), (int) $participant->actor_id),
                [
                    'joined_at' => (int) $participant->joined_at,
                    'left_at' => $participant->left_at === null ? null : (int) $participant->left_at,
                    'last_read_message_id' => !$showReadReceipts || $participant->last_read_message_id === null
                        ? null
                        : (int) $participant->last_read_message_id,
                ]
            ), $participants->all()),
        ];
    }

    private function assertCanCreate(
        array $creator,
        int $teamId,
        int $memberId,
        ChatConversationKind $kind,
        bool $temporary
    ): void
    {
        if ($creator['type'] === ChatActorType::Customer) {
            $settings = app(TeamSetting::class)->internal($teamId, 'chat');
            if ($kind === ChatConversationKind::Direct
                && ($settings['customer_direct_start'] ?? '0') !== '1') {
                throw new HttpException(403, '团队未允许客户发起会话');
            }
            if ($kind === ChatConversationKind::Group
                && ($settings['customer_group_mode'] ?? ChatCustomerGroupMode::InviteOnly->value)
                    !== ChatCustomerGroupMode::Create->value) {
                throw new HttpException(403, '团队未允许客户创建群聊');
            }
            if ($temporary) {
                throw new HttpException(403, '客户不能创建临时会话');
            }
            return;
        }
        $keys = ['chat.conversation.create'];
        if ($temporary) {
            $keys[] = 'chat.temporary.create';
        }
        foreach ($keys as $key) {
            app(PermissionGate::class)->assert($teamId, $memberId, [$key]);
        }
    }

    private function assertParticipantPolicy(
        int $teamId,
        array $participants,
        ?array $creator,
        ChatConversationKind $kind
    ): void {
        if ($creator && $creator['type'] === ChatActorType::Customer) {
            foreach ($participants as $participant) {
                if ($participant['type'] === ChatActorType::Customer
                    && $participant['id'] !== $creator['id']) {
                    throw new HttpException(403, '客户不能主动邀请其他客户');
                }
                if ($participant['type'] === ChatActorType::Member
                    && !(bool) $participant['model']->is_displayed) {
                    throw new HttpException(403, '该团队成员未公开聊天身份');
                }
            }
            if ($kind === ChatConversationKind::Direct) {
                return;
            }
        }
        if ($kind !== ChatConversationKind::Group) {
            return;
        }
        $hasCustomer = (bool) array_filter(
            $participants,
            static fn (array $actor): bool => $actor['type'] === ChatActorType::Customer
        );
        if (!$hasCustomer) {
            return;
        }
        $settings = app(TeamSetting::class)->internal($teamId, 'chat');
        $mode = $settings['customer_group_mode'] ?? ChatCustomerGroupMode::InviteOnly->value;
        if ($mode === ChatCustomerGroupMode::Disabled->value) {
            throw new HttpException(403, '团队已禁止客户加入群聊');
        }
        if ($creator && $creator['type'] === ChatActorType::Customer
            && $mode !== ChatCustomerGroupMode::Create->value) {
            throw new HttpException(403, '客户只能由团队成员邀请进入群聊');
        }
    }

    private function assertGroupManager(
        ChatConversationModel $conversation,
        int $teamId,
        int $memberId,
        int $customerId
    ): void {
        if ($conversation->enumCase('kind') !== ChatConversationKind::Group) {
            throw new HttpException(422, '单聊不支持参与者管理');
        }
        $this->assertAccess($conversation, $teamId, $memberId, $customerId);
        app(PermissionGate::class)->assert($teamId, $memberId, ['chat.group.manage']);
    }

    private function conversation(int $teamId, string $uuid, bool $withParticipants): ChatConversationModel
    {
        $query = ChatConversationModel::where('team_id', $teamId);
        if ($withParticipants) {
            $query->with(['participants']);
        }
        $conversation = $query->where('uuid', strtolower(trim($uuid)))->find();
        if (!$conversation) {
            throw new HttpException(404, '会话不存在');
        }
        return $conversation;
    }

    private function directKey(int $teamId, array $actors): string
    {
        $keys = array_map(fn ($actor) => "{$actor['type']->value}:{$actor['id']}", $actors);
        sort($keys, SORT_STRING);
        return hash('sha256', $teamId . '|' . implode('|', $keys));
    }

    private function showReadReceipts(int $teamId): bool
    {
        $settings = app(TeamSetting::class)->internal($teamId, 'chat');
        return (string) ($settings['read_receipts'] ?? '1') === '1';
    }

    private function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
            . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
    }

    private function outbox(int $teamId, string $eventType, int $id, array $payload): void
    {
        $event = app(\app\model\ChatEventOutbox::class, [], true);
        $event->save([
            'team_id' => $teamId, 'event_type' => $eventType, 'aggregate_type' => 'conversation',
            'aggregate_id' => $id, 'payload' => $payload, 'attempts' => 0, 'available_at' => time(),
        ]);
    }

    private function validate(array $data): void
    {
        $validator = new \app\validate\ChatConversation;
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
