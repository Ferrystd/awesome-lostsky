<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamEntityProfile as Profile;
use think\facade\Db;

class EntityProfile
{
    public const FIELDS = ['name', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'];

    public function ensure(int $entityId, array $data = []): Profile
    {
        $profile = Profile::where('entity_id', $entityId)->findOrEmpty();
        if ($profile->isEmpty()) {
            $profile->save(array_merge(['entity_id' => $entityId, 'name' => '', 'avatar' => ''], $this->pick($data)));
        }
        return $profile;
    }

    public function listing(int $teamId, ?string $type, int $page, int $limit): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = \app\model\Entity::with(['profile'])
            ->where(function ($query) use ($teamId) {
                $query->where('entityable_type', 'team')->where('entityable_id', $teamId)
                    ->whereOr(function ($query) use ($teamId) { $query->where('entityable_type', 'teamMember')->whereIn('entityable_id', \app\model\TeamMember::where('team_id', $teamId)->column('id')); })
                    ->whereOr(function ($query) use ($teamId) { $query->where('entityable_type', 'teamCustomer')->whereIn('entityable_id', \app\model\TeamCustomer::where('team_id', $teamId)->column('id')); })
                    ->whereOr(function ($query) use ($teamId) { $query->where('entityable_type', 'teamVirtual')->whereIn('entityable_id', \app\model\TeamVirtual::where('team_id', $teamId)->column('id')); });
            });
        if ($type !== null) $query->where('entityable_type', $type);
        $total = $query->count();
        $list = $query->order('id', 'asc')->page($page, $limit)->select()->toArray();
        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $entityId): array
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $entity = \app\model\Entity::with(['profile'])->findOrFail($entityId);
        return $entity->toArray();
    }

    public function update(int $teamId, int $entityId, array $data): void
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $data = $this->pick($data);
        if (!$data) return;
        Db::transaction(function () use ($entityId, $data) {
            $profile = $this->ensure($entityId);
            $profile->save($data);
            if (array_key_exists('introduction_markdown', $data)) app(Markdown::class)->sync($profile, 'introduction_markdown', $data['introduction_markdown']);
        });
    }

    private function pick(array $data): array { return array_intersect_key($data, array_flip(self::FIELDS)); }
}
