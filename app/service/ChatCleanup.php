<?php
declare(strict_types=1);

namespace app\service;

use app\model\ChatConversation;
use app\model\ChatEventOutbox;
use app\model\ChatMessage;
use app\model\ChatParticipant;

class ChatCleanup
{
    public function run(): array
    {
        $closed = 0;
        foreach (ChatConversation::whereNull('closed_at')->whereNotNull('expires_at')
            ->where('expires_at', '<=', time())->select() as $conversation) {
            \think\facade\Db::transaction(function () use ($conversation): void {
                $conversation->save(['closed_at' => time()]);
                $event = app(ChatEventOutbox::class, [], true);
                $event->save([
                    'team_id' => $conversation->team_id,
                    'event_type' => 'conversation.closed',
                    'aggregate_type' => 'conversation',
                    'aggregate_id' => $conversation->id,
                    'payload' => [
                        'conversation' => $conversation->uuid,
                        'reason' => 'expired',
                        'recipient_entity_ids' => ChatParticipant::where('conversation_id', $conversation->id)
                            ->where('status', 'active')->whereNull('left_at')->column('entity_id'),
                    ],
                    'attempts' => 0,
                    'available_at' => time(),
                ]);
            });
            $closed++;
        }

        $deleted = 0;
        $teamIds = ChatConversation::where('kind', 'group')->whereNotNull('team_id')->distinct(true)->column('team_id');
        foreach ($teamIds as $teamId) {
            $settings = app(TeamSetting::class)->internal((int) $teamId, 'chat');
            $days = (int) ($settings['retention_days'] ?? 0);
            if ($days <= 0) {
                continue;
            }
            $cutoff = time() - $days * 86400;
            do {
                $rows = ChatMessage::where('team_id', $teamId)->where('create_time', '<', $cutoff)->limit(500)->select();
                foreach ($rows as $message) { $message->save(['content' => null]); $message->delete(); $deleted++; }
            } while (count($rows) === 500);
        }
        return compact('closed', 'deleted');
    }
}
