<?php
declare(strict_types=1);

namespace app\event;

final class TeamAbilityExpired
{
    public function __construct(
        public readonly int $teamId,
        public readonly string $abilityKey,
        public readonly int $previousLevel,
        public readonly int $currentLevel,
        public readonly int $expiredAt,
        public readonly bool $shopClosed = false,
    ) {}
}
