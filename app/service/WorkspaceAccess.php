<?php
declare(strict_types=1);

namespace app\service;

use app\exception\AccessDeniedException;
use app\model\Entity;
use app\model\TeamEntityRole;
use think\exception\HttpException;

final class WorkspaceAccess
{
    public function inspect(int $teamId, array $subject): array
    {
        $entityId = (int) ($subject['entity_id'] ?? 0);
        $type = (string) ($subject['type'] ?? '');
        $id = (int) ($subject['id'] ?? 0);
        $entity = $entityId > 0 ? Entity::find($entityId) : null;
        if (!$entity || !$entity->is_valid
            || (string) $entity->entityable_type !== $type
            || (int) $entity->entityable_id !== $id) {
            throw new HttpException(401, '人员身份无效');
        }

        $belongs = app(IdentitySession::class)->entityTeamId($type, $id) === $teamId;
        $hasRole = $belongs || (bool) TeamEntityRole::where('team_id', $teamId)
            ->where('entity_id', $entityId)
            ->find();

        return [
            'belongs_to_team' => $belongs,
            'is_external' => !$belongs,
            'has_workspace_role' => $hasRole,
        ];
    }

    public function assert(int $teamId, array $subject, string $teamSlug): array
    {
        $result = $this->inspect($teamId, $subject);
        if (!$result['has_workspace_role']) {
            throw AccessDeniedException::teamWorkspaceRole($teamSlug);
        }

        return $result;
    }
}
