<?php
declare(strict_types=1);

namespace app\service;

use app\model\EntityIdentity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\TeamVirtual;
use think\exception\HttpException;

class EntityRole
{
    public function list(int $teamId, string $slug): array
    {
        $entity = $this->entity($teamId, $slug);
        return TeamEntityRole::where('team_id', $teamId)->where('entity_type', $entity['type'])
            ->where('entity_id', $entity['id'])->with(['role'])->order('id', 'asc')->select()->toArray();
    }

    public function save(int $teamId, string $slug, array $roleIds): void
    {
        $entity = $this->entity($teamId, $slug);
        $ids = array_values(array_unique(array_map(static fn ($id): int => filter_var($id, FILTER_VALIDATE_INT) !== false ? (int) $id : 0, $roleIds)));
        if (in_array(0, $ids, true)) throw new HttpException(422, 'Role IDs are invalid');
        TeamEntityRole::transaction(function () use ($teamId, $entity, $ids): void {
            if ($ids && TeamRole::where('team_id', $teamId)->whereIn('id', $ids)->count() !== count($ids)) {
                throw new HttpException(404, 'Role does not exist');
            }
            $records = TeamEntityRole::withTrashed()->where('team_id', $teamId)
                ->where('entity_type', $entity['type'])->where('entity_id', $entity['id'])->lock(true)->select();
            $existing = [];
            foreach ($records as $record) {
                $existing[(int) $record->role_id] = $record;
                if (!in_array((int) $record->role_id, $ids, true) && !$record->trashed()) $record->delete();
            }
            foreach ($ids as $roleId) {
                if (isset($existing[$roleId])) { if ($existing[$roleId]->trashed()) $existing[$roleId]->restore(); continue; }
                $record = app(TeamEntityRole::class, [], true);
                $record->save(['team_id' => $teamId, 'entity_type' => $entity['type'], 'entity_id' => $entity['id'], 'role_id' => $roleId]);
            }
        });
    }

    private function entity(int $teamId, string $slug): array
    {
        $identity = EntityIdentity::where('slug', strtolower(trim($slug)))->find();
        if (!$identity) throw new HttpException(404, 'Entity identity does not exist');
        $type = (string) $identity->entityable_type;
        $id = (int) $identity->entityable_id;
        $model = match ($type) {
            'teamMember' => TeamMember::where('team_id', $teamId)->find($id),
            'teamCustomer' => TeamCustomer::where('team_id', $teamId)->find($id),
            'teamVirtual' => TeamVirtual::where('team_id', $teamId)->find($id),
            'team' => Team::where('id', $teamId)->where('id', $id)->find(),
            default => null,
        };
        if (!$model) throw new HttpException(404, 'Entity is outside this team');
        return ['type' => $type, 'id' => $id];
    }
}
