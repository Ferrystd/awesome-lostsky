<?php
declare(strict_types=1);

namespace app\listener;

use app\event\TeamAbilityExpired;
use app\service\AbilityCatalog;
use app\service\Notice;

final class SendAbilityExpirationNotice
{
    public function handle(TeamAbilityExpired $event): void
    {
        $label = AbilityCatalog::label($event->abilityKey);
        $effect = $event->currentLevel > 0
            ? "Ability 已降为等级 {$event->currentLevel}。"
            : 'Ability 已不可用。';
        if ($event->shopClosed) {
            $effect .= ' “开放商城”已自动关闭，恢复 Ability 后需由管理员重新开启。';
        }

        app(Notice::class)->sendOnce(
            $event->teamId,
            "{$label} Ability 已到期",
            "{$label}（{$event->abilityKey}）从等级 {$event->previousLevel} 变为等级 {$event->currentLevel}。\n\n"
                . '到期时间：' . date('Y-m-d H:i:s', $event->expiredAt) . "\n\n{$effect}",
            "ability-expired:{$event->teamId}:{$event->abilityKey}:{$event->expiredAt}"
        );
    }
}
