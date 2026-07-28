<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use app\model\TeamEntityRole;
use app\model\TeamRole;
use think\exception\HttpException;

class EntityRole
{
    public function list(int $teamId, string $slug): array
    {
        $entity = $this->entity($slug);
        return TeamEntityRole::where('team_id', $teamId)
            ->where('entity_id', $entity['entity_id'])
            ->with(['role.permissions'])
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    public function summary(int $teamId, string $slug): array
    {
        $assignments = $this->list($teamId, $slug);
        $catalog = app(RolePermission::class)->catalog($teamId);
        $labels = [];
        foreach ($catalog['groups'] as $group) {
            foreach ($group['items'] as $item) {
                $labels[$item['key']] = [
                    'label' => $item['label'],
                    'group' => $group['name'],
                ];
            }
        }

        $keys = [];
        foreach ($assignments as $assignment) {
            foreach (($assignment['role']['permissions'] ?? []) as $permission) {
                $key = (string) ($permission['permission_key'] ?? '');
                if ($key !== '') {
                    $keys[$key] = true;
                }
            }
        }
        ksort($keys);

        $effective = [];
        foreach (array_keys($keys) as $key) {
            $effective[] = [
                'key' => $key,
                'label' => $labels[$key]['label'] ?? $key,
                'group' => $labels[$key]['group'] ?? '动态权限',
            ];
        }

        return [
            'role_assignments' => $assignments,
            'effective_permissions' => $effective,
        ];
    }

    public function save(int $teamId, string $slug, array $roleIds): void
    {
        $entity = $this->entity($slug);
        $ids = array_values(array_unique(array_map(static fn ($id): int => filter_var($id, FILTER_VALIDATE_INT) !== false ? (int) $id : 0, $roleIds)));
        if (in_array(0, $ids, true)) throw new HttpException(422, 'Role IDs are invalid');
        TeamEntityRole::transaction(function () use ($teamId, $entity, $ids): void {
            if ($ids && TeamRole::where('team_id', $teamId)->whereIn('id', $ids)->count() !== count($ids)) {
                throw new HttpException(404, 'Role does not exist');
            }
            $records = TeamEntityRole::withTrashed()->where('team_id', $teamId)
                ->where('entity_id', $entity['entity_id'])->lock(true)->select();
            $existing = [];
            foreach ($records as $record) {
                $existing[(int) $record->role_id] = $record;
                if (!in_array((int) $record->role_id, $ids, true) && !$record->trashed()) $record->delete();
            }
            foreach ($ids as $roleId) {
                if (isset($existing[$roleId])) { if ($existing[$roleId]->trashed()) $existing[$roleId]->restore(); continue; }
                $record = app(TeamEntityRole::class, [], true);
                $record->save(['team_id' => $teamId, 'entity_id' => $entity['entity_id'], 'role_id' => $roleId]);
            }
        });
    }

    public function describe(int $teamId, string $slug): array
    {
        $entity = $this->entity($slug);
        return [
            'type' => $entity['type'],
            'id' => $entity['id'],
            'slug' => $entity['identity']->slug,
            'name' => app(IdentitySession::class)->entityName($entity['type'], $entity['id']),
            'team' => app(IdentitySession::class)->teamSummary($entity['team_id']),
            'is_external' => $entity['team_id'] !== $teamId,
        ];
    }

    private function entity(string $slug): array
    {
        $identity = Entity::where('slug', strtolower(trim($slug)))->find();
        if (!$identity || !$identity->is_valid) {
            throw new HttpException(404, 'Entity identity is unavailable');
        }
        $type = (string) $identity->entityable_type;
        $id = (int) $identity->entityable_id;
        $teamId = app(IdentitySession::class)->entityTeamId($type, $id);
        if ($teamId < 1) {
            throw new HttpException(404, 'Entity identity is unavailable');
        }
        return ['entity_id' => (int) $identity->id, 'type' => $type, 'id' => $id, 'team_id' => $teamId, 'identity' => $identity];
    }
}
