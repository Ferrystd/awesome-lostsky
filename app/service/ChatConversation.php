<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatConversationKind;
use app\enum\ChatParticipantStatus;
use app\model\ChatConversation as ConversationModel;
use app\model\ChatConversationAlias;
use app\model\ChatParticipant;
use think\exception\HttpException;
use think\facade\Db;

class ChatConversation
{
    public function list(array $acting): array
    {
        $ids = ChatParticipant::where('entity_id', (int) ($acting['entity_id'] ?? 0))
            ->where('status', 'active')->whereNull('left_at')->column('conversation_id');
        if (!$ids) return [];
        $rows = ConversationModel::whereIn('id', $ids)
            ->with(['participants'])->order('last_message_at', 'desc')->order('id', 'desc')->select()->all();
        return array_values(array_map(fn ($row) => $this->summary($row), array_filter(
            $rows,
            fn ($row): bool => !$this->isExpired($row)
        )));
    }

    public function get(string $uuid, array $acting): array
    {
        $conversation = $this->model($uuid, true);
        $this->assertAccess($conversation, $acting);
        return $this->summary($conversation);
    }

    public function create(array $acting, int $expectedEntityId, array $data): array
    {
        $creatorId = app(ChatIdentity::class)->expected($acting, $expectedEntityId);
        if (($data['kind'] ?? 'direct') !== 'direct') throw new HttpException(422, '群聊请在 Team 的聊天管理中创建');
        $targets = array_values(array_unique(array_filter(array_map(
            static fn ($value): string => strtolower(trim((string) (is_array($value) ? ($value['slug'] ?? '') : $value))),
            is_array($data['participants'] ?? null) ? $data['participants'] : []
        ))));
        if (count($targets) !== 1) throw new HttpException(422, '单聊必须指定一个对方人员');
        $target = app(ChatActor::class)->resolveGlobal($targets[0], false);
        $targetId = (int) $target['entity_id'];
        if ($targetId === $creatorId) throw new HttpException(422, '不能与当前人员创建单聊');
        if (app(ChatBlock::class)->blockedEitherWay($creatorId, $targetId)) throw new HttpException(403, '当前双方不能建立新的单聊');
        $temporary = (int) ($data['is_temporary'] ?? 0) === 1;
        $expiresAt = !empty($data['expires_at']) ? (int) $data['expires_at'] : null;
        if (!$temporary && $expiresAt) throw new HttpException(422, '只有临时会话可以设置到期时间');
        if ($temporary && $expiresAt !== null && $expiresAt <= time()) throw new HttpException(422, '到期时间必须晚于当前时间');
        $directKey = $temporary ? null : $this->directKey($creatorId, $targetId);
        if ($directKey && ($existing = ConversationModel::where('direct_key', $directKey)->find())) return ['uuid' => (string) $existing->uuid, 'existing' => true];
        $uuid = $this->uuid();
        try {
            Db::transaction(function () use ($creatorId, $targetId, $temporary, $expiresAt, $directKey, $uuid): void {
                $conversation = app(ConversationModel::class, [], true);
                $conversation->save(['team_id' => null, 'uuid' => $uuid, 'kind' => ChatConversationKind::Direct,
                    'title' => null, 'direct_key' => $directKey, 'is_temporary' => $temporary ? 1 : 0,
                    'entity_id' => $creatorId, 'expires_at' => $expiresAt]);
                foreach ([$creatorId, $targetId] as $entityId) {
                    $participant = app(ChatParticipant::class, [], true);
                    $participant->save(['team_id' => null, 'conversation_id' => $conversation->id,
                        'entity_id' => $entityId, 'status' => ChatParticipantStatus::Active, 'joined_at' => time()]);
                }
                $this->outbox(null, 'conversation.created', (int) $conversation->id,
                    ['conversation' => $uuid, 'kind' => 'direct'], [$creatorId, $targetId]);
            });
        } catch (\Throwable $e) {
            if ($directKey && ($existing = ConversationModel::where('direct_key', $directKey)->find())) return ['uuid' => (string) $existing->uuid, 'existing' => true];
            throw $e;
        }
        return ['uuid' => $uuid, 'existing' => false];
    }

    public function invitations(array $acting): array
    {
        $rows = ChatParticipant::where('entity_id', (int) ($acting['entity_id'] ?? 0))
            ->where('status', 'pending')->whereNull('left_at')->with(['conversation'])->select();
        return array_map(fn ($row): array => array_merge($this->invitationSummary($row->conversation), [
            'invited_at' => $row->invited_at === null ? null : (int) $row->invited_at,
            'invited_by' => $row->invited_by_entity_id ? app(ChatActor::class)->summaryEntity((int) $row->invited_by_entity_id) : null,
        ]), $rows->all());
    }

    public function respondInvitation(array $acting, int $expectedEntityId, string $uuid, bool $accept): void
    {
        $entityId = app(ChatIdentity::class)->expected($acting, $expectedEntityId);
        $conversation = $this->model($uuid);
        Db::transaction(function () use ($conversation, $entityId, $accept): void {
            $lockedConversation = ConversationModel::where('id', $conversation->id)->lock(true)->find();
            if (!$lockedConversation || $lockedConversation->is_closed) throw new HttpException(409, '会话已经关闭');
            $participant = ChatParticipant::where('conversation_id', $lockedConversation->id)->where('entity_id', $entityId)
                ->where('status', 'pending')->whereNull('left_at')->lock(true)->find();
            if (!$participant) throw new HttpException(404, '待处理邀请不存在');
            if ($accept && $participant->invited_by_entity_id && app(ChatBlock::class)->blockedEitherWay($entityId, (int) $participant->invited_by_entity_id)) {
                throw new HttpException(403, '当前双方不能建立新的联系');
            }
            $participant->save(['status' => $accept ? ChatParticipantStatus::Active : ChatParticipantStatus::Rejected, 'joined_at' => $accept ? time() : 0,
                'responded_at' => time(), 'left_at' => $accept ? null : time()]);
            if ($accept) {
                $this->outbox((int) $lockedConversation->team_id, 'conversation.participants.added', (int) $lockedConversation->id,
                    ['conversation' => (string) $lockedConversation->uuid, 'participants' => [app(ChatActor::class)->summaryEntity($entityId)]],
                    $this->activeRecipientIds((int) $lockedConversation->id));
            }
        });
    }

    public function leave(array $acting, int $expectedEntityId, string $uuid): void
    {
        $entityId = app(ChatIdentity::class)->expected($acting, $expectedEntityId);
        $conversation = $this->model($uuid);
        if ($conversation->enumCase('kind') !== ChatConversationKind::Group) throw new HttpException(422, '单聊不能退出');
        $participant = ChatParticipant::where('conversation_id', $conversation->id)->where('entity_id', $entityId)
            ->where('status', 'active')->whereNull('left_at')->find();
        if (!$participant) throw new HttpException(404, '你不在该群聊中');
        Db::transaction(function () use ($participant, $conversation, $entityId): void {
            $locked = ChatParticipant::where('id', $participant->id)->whereNull('left_at')->lock(true)->find();
            if (!$locked) throw new HttpException(404, '你不在该群聊中');
            $locked->save(['left_at' => time()]);
            $this->outbox((int) $conversation->team_id, 'conversation.participant.removed', (int) $conversation->id,
                ['conversation' => (string) $conversation->uuid, 'participant' => app(ChatActor::class)->summaryEntity($entityId)],
                $this->activeRecipientIds((int) $conversation->id));
        });
        app(ChatRealtime::class)->unsubscribeEntity($entityId, (string) $conversation->uuid);
    }

    public function teamList(int $teamId): array
    {
        return array_map(fn ($row) => $this->summary($row), ConversationModel::where('team_id', $teamId)
            ->where('kind', 'group')->with(['participants'])->order('id', 'desc')->select()->all());
    }

    public function teamGet(int $teamId, string $uuid): array { return $this->summary($this->teamModel($teamId, $uuid, true)); }

    public function teamCreate(int $teamId, array $acting, int $expected, string $title, array $slugs): array
    {
        $inviterId = $this->assertTeamManager($teamId, $acting, $expected);
        $title = $this->title($title); $uuid = $this->uuid();
        Db::transaction(function () use ($teamId, $inviterId, $title, $slugs, $uuid): void {
            $conversation = app(ConversationModel::class, [], true);
            $conversation->save(['team_id' => $teamId, 'uuid' => $uuid, 'kind' => ChatConversationKind::Group,
                'title' => $title, 'is_temporary' => 0, 'entity_id' => $inviterId]);
            $this->inviteRows($conversation, $inviterId, $slugs);
            $this->outbox($teamId, 'conversation.created', (int) $conversation->id, ['conversation' => $uuid, 'kind' => 'group'], []);
        });
        return ['uuid' => $uuid];
    }

    public function teamUpdate(int $teamId, array $acting, int $expected, string $uuid, string $title): void
    { $this->assertTeamManager($teamId, $acting, $expected); $row = $this->teamModel($teamId, $uuid); if ($row->is_closed) throw new HttpException(409, '会话已经关闭'); $row->save(['title' => $this->title($title)]); }

    public function teamInvite(int $teamId, array $acting, int $expected, string $uuid, array $slugs): void
    {
        $id = $this->assertTeamManager($teamId, $acting, $expected);
        $row = $this->teamModel($teamId, $uuid);
        Db::transaction(function () use ($row, $id, $slugs): void {
            $locked = ConversationModel::where('id', $row->id)->lock(true)->find();
            if (!$locked || $locked->is_closed) throw new HttpException(409, '会话已经关闭');
            $this->inviteRows($locked, $id, $slugs);
        });
    }

    public function teamCancelInvitation(int $teamId, array $acting, int $expected, string $uuid, string $slug): void
    {
        $this->assertTeamManager($teamId, $acting, $expected); $target = app(ChatActor::class)->resolveGlobal($slug);
        ChatParticipant::where('conversation_id', $this->teamModel($teamId, $uuid)->id)
            ->where('entity_id', $target['entity_id'])->where('status', 'pending')->delete();
    }

    public function teamRemove(int $teamId, array $acting, int $expected, string $uuid, string $slug): void
    {
        $this->assertTeamManager($teamId, $acting, $expected); $target = app(ChatActor::class)->resolveGlobal($slug);
        $conversation = $this->teamModel($teamId, $uuid);
        Db::transaction(function () use ($conversation, $target): void {
            $row = ChatParticipant::where('conversation_id', $conversation->id)
                ->where('entity_id', $target['entity_id'])->where('status', 'active')->whereNull('left_at')
                ->lock(true)->find();
            if (!$row) throw new HttpException(404, '参与者不在群聊中');
            $row->save(['left_at' => time()]);
            $this->outbox((int) $conversation->team_id, 'conversation.participant.removed', (int) $conversation->id,
                ['conversation' => (string) $conversation->uuid, 'participant' => app(ChatActor::class)->summaryEntity((int) $target['entity_id'])],
                $this->activeRecipientIds((int) $conversation->id));
        });
        app(ChatRealtime::class)->unsubscribeEntity((int) $target['entity_id'], $uuid);
    }

    public function teamClose(int $teamId, array $acting, int $expected, string $uuid): void
    {
        $this->assertTeamManager($teamId, $acting, $expected);
        $conversation = $this->teamModel($teamId, $uuid);
        Db::transaction(function () use ($conversation): void {
            $row = ConversationModel::where('id', $conversation->id)->lock(true)->find();
            if ($row && !$row->is_closed) {
                $row->save(['closed_at' => time()]);
                $this->outbox((int) $row->team_id, 'conversation.closed', (int) $row->id,
                    ['conversation' => (string) $row->uuid], $this->activeRecipientIds((int) $row->id));
            }
        });
    }

    public function model(string $uuid, bool $withParticipants = false): ConversationModel
    {
        $uuid = strtolower(trim($uuid)); $query = ConversationModel::where('uuid', $uuid);
        if ($withParticipants) $query->with(['participants']); $row = $query->find();
        if (!$row && ($alias = ChatConversationAlias::where('alias_uuid', $uuid)->find())) {
            $query = ConversationModel::where('id', $alias->conversation_id); if ($withParticipants) $query->with(['participants']); $row = $query->find();
        }
        if (!$row) throw new HttpException(404, '会话不存在'); return $row;
    }

    public function assertAccess(ConversationModel $conversation, array $acting): void
    { if (!$this->canAccess($conversation, $acting)) throw new HttpException(403, '你不是该会话的参与者'); }

    public function canAccess(ConversationModel $conversation, array $acting): bool
    { return !$this->isExpired($conversation) && (bool) ChatParticipant::where('conversation_id', $conversation->id)->where('entity_id', (int) ($acting['entity_id'] ?? 0))->where('status', 'active')->whereNull('left_at')->find(); }

    private function inviteRows(ConversationModel $conversation, int $inviterId, array $slugs): void
    {
        $slugs = array_values(array_unique(array_filter(array_map('strval', $slugs)))); if (!$slugs) throw new HttpException(422, '请至少邀请一个人员');
        foreach ($slugs as $slug) {
            $target = app(ChatActor::class)->resolveGlobal($slug, false); $targetId = (int) $target['entity_id'];
            if (app(ChatBlock::class)->blockedEitherWay($inviterId, $targetId)) continue;
            $row = ChatParticipant::withTrashed()->where('conversation_id', $conversation->id)->where('entity_id', $targetId)->find();
            if ($row && $row->enumCase('status') === ChatParticipantStatus::Active && !$row->left_at && !$row->trashed()) continue;
            if (!$row) $row = app(ChatParticipant::class, [], true);
            $row->save(['team_id' => $conversation->team_id, 'conversation_id' => $conversation->id, 'entity_id' => $targetId,
                'status' => ChatParticipantStatus::Pending, 'invited_by_entity_id' => $inviterId, 'invited_at' => time(), 'responded_at' => null,
                'joined_at' => 0, 'left_at' => null, 'last_read_message_id' => null, 'delete_time' => null]);
        }
    }

    private function teamModel(int $teamId, string $uuid, bool $with = false): ConversationModel
    { $row = $this->model($uuid, $with); if ((int) $row->team_id !== $teamId || $row->enumCase('kind') !== ChatConversationKind::Group) throw new HttpException(404, '团队群聊不存在'); return $row; }

    private function assertTeamManager(int $teamId, array $acting, int $expected): int
    { $id = app(ChatIdentity::class)->expected($acting, $expected); app(PermissionGate::class)->assert($teamId, $acting, [PermissionDictionary::CHAT_GROUP_MANAGE]); return $id; }

    private function summary(ConversationModel $conversation): array
    {
        $participants = $conversation->participants;
        return ['uuid' => (string) $conversation->uuid, 'team_id' => $conversation->team_id === null ? null : (int) $conversation->team_id,
            'kind' => $conversation->enumCase('kind')->value, 'title' => $conversation->title, 'is_temporary' => (bool) $conversation->is_temporary,
            'is_closed' => $conversation->is_closed, 'expires_at' => $conversation->expires_at, 'last_message_at' => $conversation->last_message_at,
            'last_message' => $conversation->last_message_id ? $conversation->lastMessage?->content : null, 'participants' => array_map(fn ($row): array => array_merge(
                app(ChatActor::class)->summaryEntity((int) $row->entity_id), ['status' => $row->enumCase('status')->value,
                    'joined_at' => (int) $row->joined_at, 'left_at' => $row->left_at === null ? null : (int) $row->left_at,
                    'last_read_message_id' => $row->last_read_message_id === null ? null : (int) $row->last_read_message_id]), $participants->all())];
    }

    private function invitationSummary(ConversationModel $conversation): array
    {
        return [
            'uuid' => (string) $conversation->uuid,
            'team_id' => $conversation->team_id === null ? null : (int) $conversation->team_id,
            'kind' => $conversation->enumCase('kind')->value,
            'title' => $conversation->title,
            'is_temporary' => (bool) $conversation->is_temporary,
            'is_closed' => $conversation->is_closed,
            'expires_at' => $conversation->expires_at,
        ];
    }

    private function isExpired(ConversationModel $conversation): bool
    {
        return $conversation->expires_at !== null && (int) $conversation->expires_at <= time();
    }

    private function activeRecipientIds(int $conversationId): array
    {
        return ChatParticipant::where('conversation_id', $conversationId)->where('status', 'active')
            ->whereNull('left_at')->column('entity_id');
    }

    private function title(string $title): string { $title = trim($title); if ($title === '' || mb_strlen($title) > 100) throw new HttpException(422, '群聊标题应为 1 至 100 个字符'); return $title; }
    private function directKey(int $a, int $b): string { $ids = [$a, $b]; sort($ids, SORT_NUMERIC); return hash('sha256', implode('|', $ids)); }
    private function uuid(): string { $b=random_bytes(16);$b[6]=chr((ord($b[6])&15)|64);$b[8]=chr((ord($b[8])&63)|128);$h=bin2hex($b);return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20); }
    private function outbox(?int $teamId, string $type, int $id, array $payload, array $recipients): void { $payload['recipient_entity_ids']=array_values(array_unique(array_map('intval',$recipients)));$event=app(\app\model\ChatEventOutbox::class,[],true);$event->save(['team_id'=>$teamId,'event_type'=>$type,'aggregate_type'=>'conversation','aggregate_id'=>$id,'payload'=>$payload,'attempts'=>0,'available_at'=>time()]); }
}
