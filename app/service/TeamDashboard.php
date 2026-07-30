<?php
declare(strict_types=1);

namespace app\service;

class TeamDashboard
{
    public function summary(int $teamId, array $actingEntity): array
    {
        $gate = app(PermissionGate::class);
        $canReadAllEntities = $gate->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_ENTITY_READ]
        );
        $canReadAllMembers = $gate->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_MEMBER_READ]
        );
        $canReadAllDocuments = $gate->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_DOCUMENT_READ]
        );
        $docAbility = app(TeamAccess::class)->ability($teamId, 'doc', '文档');

        return [
            'entities' => $canReadAllEntities
                ? $this->metric(fn (): int => (int) app(EntityProfile::class)
                    ->listing($teamId, null, 1, 1, true)['total'])
                : $this->direction(),
            'members' => $canReadAllMembers
                ? $this->metric(fn (): int => \app\model\TeamMember::where('team_id', $teamId)->count())
                : $this->direction(),
            'documents' => !$docAbility['enabled']
                ? [
                    'available' => false,
                    'count' => null,
                    'error' => null,
                    'reason' => [
                        'kind' => 'ability',
                        'key' => 'doc',
                        'label' => '文档',
                    ],
                ]
                : ($canReadAllDocuments
                    ? $this->metric(function () use ($teamId, $actingEntity): int {
                    $teamEntity = app(Entity::class)->requireBySubject('team', $teamId);
                    return (int) app(Document::class)->list(
                        (int) $teamEntity->id,
                        [],
                        1,
                        1,
                        $teamId,
                        $actingEntity
                    )['total'];
                })
                    : $this->direction()),
            'notices' => $this->metric(fn (): int => (int) app(Notice::class)
                ->listForEntity((int) $actingEntity['entity_id'], ['is_read' => 0], 1, 1)['total']),
        ];
    }

    private function metric(callable $count): array
    {
        try {
            return [
                'available' => true,
                'count' => $count(),
                'error' => null,
                'reason' => null,
            ];
        } catch (\Throwable) {
            return [
                'available' => true,
                'count' => null,
                'error' => '暂时无法读取',
                'reason' => null,
            ];
        }
    }

    private function direction(): array
    {
        return [
            'available' => true,
            'count' => null,
            'error' => null,
            'reason' => null,
        ];
    }
}
