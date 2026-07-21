<?php
declare(strict_types=1);

namespace app\service;

use app\model\ChatConversation;
use app\model\ChatEventOutbox;
use app\model\ChatMessage;
use app\model\Team;

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
                    ],
                    'attempts' => 0,
                    'available_at' => time(),
                ]);
            });
            $closed++;
        }

        $deleted = 0;
        foreach (Team::active()->select() as $team) {
            $settings = app(TeamSetting::class)->internal((int) $team->id, 'chat');
            $days = (int) ($settings['retention_days'] ?? 0);
            if ($days <= 0) {
                continue;
            }
            $cutoff = time() - $days * 86400;
            foreach (ChatMessage::where('team_id', $team->id)->where('create_time', '<', $cutoff)->select() as $message) {
                $message->save(['content' => null]);
                $message->delete();
                $deleted++;
            }
        }
        return compact('closed', 'deleted');
    }
}
