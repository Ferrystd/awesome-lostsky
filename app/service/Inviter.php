<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use app\model\Team;

class Inviter
{
    private const ALLOWED_TYPES = ['team', 'teamMember', 'teamVirtual'];

    public function resolve(mixed $slug): ?Entity
    {
        $slug = strtolower(trim(is_string($slug) ? $slug : ''));
        if ($slug === '' || !preg_match('/^[a-z][a-z0-9_-]{1,49}$/D', $slug)) {
            return null;
        }

        $entity = Entity::where('slug', $slug)->find();
        if (!$entity
            || !in_array((string) $entity->entityable_type, self::ALLOWED_TYPES, true)
            || !$entity->is_valid) {
            return null;
        }

        return $entity;
    }

    public function summary(int $targetTeamId, mixed $entityId): ?array
    {
        $entityId = is_numeric($entityId) ? (int) $entityId : 0;
        if ($entityId < 1) {
            return null;
        }

        $entity = Entity::with('entityable')->find($entityId);
        if (!$entity || !in_array((string) $entity->entityable_type, self::ALLOWED_TYPES, true)) {
            return null;
        }

        $type = (string) $entity->entityable_type;
        $subjectId = (int) $entity->entityable_id;
        $subject = $entity->entityable;
        $teamId = $subject instanceof Team ? $subjectId : (int) ($subject?->team_id ?? 0);

        return [
            'type' => $type,
            'id' => $subjectId,
            'slug' => (string) $entity->slug,
            'name' => app(IdentitySession::class)->entityName($type, $subjectId),
            'team' => $teamId > 0 ? app(IdentitySession::class)->teamSummary($teamId) : null,
            'is_external' => $teamId > 0 && $teamId !== $targetTeamId,
        ];
    }
}
