<?php
declare(strict_types=1);

namespace app\service;

use app\model\ChatMessage as MessageModel;
use app\model\ChatParticipant;
use think\exception\HttpException;
use think\facade\Db;

class ChatMessage
{
    public function list(string $uuid, array $acting, int $beforeId = 0, int $limit = 50): array
    {
        $conversation = app(ChatConversation::class)->model($uuid, true);
        app(ChatConversation::class)->assertAccess($conversation, $acting);
        return $this->rows($conversation, $beforeId, $limit);
    }

    public function teamList(int $teamId, string $uuid, int $beforeId = 0, int $limit = 50): array
    {
        $conversation = app(ChatConversation::class)->model($uuid);
        if ((int) $conversation->team_id !== $teamId || $conversation->enumCase('kind')->value !== 'group') throw new HttpException(404, '团队群聊不存在');
        return $this->rows($conversation, $beforeId, $limit);
    }

    public function send(array $acting, int $expectedEntityId, array $data, ?int $integrationId = null): array
    {
        $entityId = app(ChatIdentity::class)->expected($acting, $expectedEntityId);
        $content = trim((string) ($data['content'] ?? ''));
        if ($content === '' || mb_strlen($content) > 5000) throw new HttpException(422, '消息内容应为 1 至 5000 个字符');
        $conversation = app(ChatConversation::class)->model((string) ($data['conversation'] ?? ''), true);
        $replyId = !empty($data['reply_id']) ? (int) $data['reply_id'] : null;
        if ($replyId && !MessageModel::where('conversation_id', $conversation->id)->find($replyId)) throw new HttpException(422, '回复的消息不属于当前会话');
        $message = null;
        Db::transaction(function () use (&$message, $conversation, $entityId, $content, $replyId, $integrationId): void {
            $lockedConversation = \app\model\ChatConversation::where('id', $conversation->id)->lock(true)->find();
            if (!$lockedConversation || $lockedConversation->is_closed) throw new HttpException(409, '会话已经关闭');
            $this->lockActiveParticipant((int) $lockedConversation->id, $entityId);
            if ($lockedConversation->enumCase('kind')->value === 'direct') {
                $otherEntityId = (int) (ChatParticipant::where('conversation_id', $lockedConversation->id)
                    ->where('entity_id', '<>', $entityId)->where('status', 'active')->whereNull('left_at')
                    ->value('entity_id') ?? 0);
                if ($otherEntityId > 0 && app(ChatBlock::class)->blockedEitherWay($entityId, $otherEntityId)) {
                    throw new HttpException(403, '当前双方不能继续发送单聊消息');
                }
            }
            $message = app(MessageModel::class, [], true);
            $message->save(['team_id' => $lockedConversation->team_id, 'conversation_id' => $lockedConversation->id,
                'entity_id' => $entityId, 'reply_id' => $replyId, 'origin_integration_id' => $integrationId, 'content' => $content]);
            $lockedConversation->save(['last_message_id' => $message->id, 'last_message_at' => time()]);
            $this->outbox($lockedConversation, 'message.created', (int) $message->id, $this->summary($message));
        });
        return $this->summary($message);
    }

    public function edit(array $acting, int $expectedEntityId, int $messageId, string $content): void
    {
        $entityId = app(ChatIdentity::class)->expected($acting, $expectedEntityId); $content = trim($content);
        if ($content === '' || mb_strlen($content) > 5000) throw new HttpException(422, '消息内容应为 1 至 5000 个字符');
        Db::transaction(function () use ($entityId, $messageId, $content): void {
            $message = $this->message($messageId); if ((int) $message->entity_id !== $entityId) throw new HttpException(403, '只能编辑自己发送的消息');
            $this->lockActiveParticipant((int) $message->conversation_id, $entityId);
            if ($message->revoked_at) throw new HttpException(409, '已撤回消息不能编辑');
            if ((int) $message->create_time < time() - 300) throw new HttpException(403, '消息编辑时间已过');
            $message->save(['content' => $content, 'edited_at' => time()]);
            $this->outbox($message->conversation, 'message.updated', $messageId, $this->summary($message));
        });
    }

    public function revoke(array $acting, int $expectedEntityId, int $messageId): void
    {
        $entityId = app(ChatIdentity::class)->expected($acting, $expectedEntityId);
        Db::transaction(function () use ($entityId, $messageId): void {
            $message = $this->message($messageId); if ((int) $message->entity_id !== $entityId) throw new HttpException(403, '只能撤回自己发送的消息');
            $this->lockActiveParticipant((int) $message->conversation_id, $entityId);
            if ((int) $message->create_time < time() - 120) throw new HttpException(403, '消息撤回时间已过');
            $this->revokeModel($message);
        });
    }

    public function teamRevoke(int $teamId, array $acting, int $expected, int $messageId): void
    {
        app(ChatIdentity::class)->expected($acting, $expected);
        app(PermissionGate::class)->assert($teamId, $acting, [PermissionDictionary::CHAT_GROUP_MANAGE]);
        $message = $this->message($messageId);
        if ((int) $message->conversation->team_id !== $teamId || $message->conversation->enumCase('kind')->value !== 'group') throw new HttpException(404, '团队群聊消息不存在');
        $this->revokeModel($message);
    }

    public function read(array $acting, int $expected, string $uuid, int $messageId): void
    {
        $entityId = app(ChatIdentity::class)->expected($acting, $expected); $conversation = app(ChatConversation::class)->model($uuid);
        app(ChatConversation::class)->assertAccess($conversation, $acting);
        if (!MessageModel::where('conversation_id', $conversation->id)->find($messageId)) throw new HttpException(422, '已读消息不属于当前会话');
        ChatParticipant::where('conversation_id', $conversation->id)->where('entity_id', $entityId)->where('status', 'active')->whereNull('left_at')->update(['last_read_message_id' => $messageId]);
    }

    private function rows($conversation, int $beforeId, int $limit): array
    {
        $query = MessageModel::where('conversation_id', $conversation->id); if ($beforeId > 0) $query->where('id', '<', $beforeId);
        $rows = $query->with(['reply'])->order('id', 'desc')->limit(max(1, min(100, $limit)))->select()->all();
        return array_map(fn ($row) => $this->summary($row), array_reverse($rows));
    }

    private function message(int $id): MessageModel { $row = MessageModel::with(['conversation'])->lock(true)->find($id); if (!$row) throw new HttpException(404, '消息不存在'); return $row; }
    private function revokeModel(MessageModel $message): void { if ($message->revoked_at) return; $message->save(['content' => null, 'revoked_at' => time()]); $this->outbox($message->conversation, 'message.revoked', (int) $message->id, $this->summary($message)); }
    private function lockActiveParticipant(int $conversationId, int $entityId): ChatParticipant
    {
        $participant = ChatParticipant::where('conversation_id', $conversationId)->where('entity_id', $entityId)
            ->where('status', 'active')->whereNull('left_at')->lock(true)->find();
        if (!$participant) throw new HttpException(403, '你不是该会话的参与者');
        return $participant;
    }
    private function summary(MessageModel $message): array { return ['id'=>(int)$message->id,'conversation'=>(string)$message->conversation->uuid,'sender'=>app(ChatActor::class)->summaryEntity((int)$message->entity_id),'content'=>$message->content,'reply_id'=>$message->reply_id===null?null:(int)$message->reply_id,'edited_at'=>$message->edited_at===null?null:(int)$message->edited_at,'revoked_at'=>$message->revoked_at===null?null:(int)$message->revoked_at,'create_time'=>(int)$message->create_time]; }
    private function outbox($conversation, string $type, int $id, array $payload): void { $payload['recipient_entity_ids']=ChatParticipant::where('conversation_id',$conversation->id)->where('status','active')->whereNull('left_at')->column('entity_id');$event=app(\app\model\ChatEventOutbox::class,[],true);$event->save(['team_id'=>$conversation->team_id,'event_type'=>$type,'aggregate_type'=>'message','aggregate_id'=>$id,'payload'=>$payload,'attempts'=>0,'available_at'=>time()]); }
}
