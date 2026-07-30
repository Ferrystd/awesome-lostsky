<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamEntityProfile as Profile;
use think\facade\Db;
use think\exception\HttpException;

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

    public function listing(int $teamId, ?string $type, int $page, int $limit, bool $canReadAll): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $memberIds = \app\model\TeamMember::where('team_id', $teamId)
            ->where('is_blocked', 0)
            ->column('id');
        $customerIds = \app\model\TeamCustomer::where('team_id', $teamId)
            ->where('is_blocked', 0)
            ->column('id');
        $virtualIds = \app\model\TeamVirtual::where('team_id', $teamId)
            ->where('is_active', 1)
            ->column('id');
        $query = \app\model\Entity::with(['profile'])
            ->where(function ($query) use ($teamId, $memberIds, $customerIds, $virtualIds) {
                $query->where('entityable_type', 'team')->where('entityable_id', $teamId)
                    ->whereOr(function ($query) use ($memberIds) { $query->where('entityable_type', 'teamMember')->whereIn('entityable_id', $memberIds); })
                    ->whereOr(function ($query) use ($customerIds) { $query->where('entityable_type', 'teamCustomer')->whereIn('entityable_id', $customerIds); })
                    ->whereOr(function ($query) use ($virtualIds) { $query->where('entityable_type', 'teamVirtual')->whereIn('entityable_id', $virtualIds); });
            });
        if (!$canReadAll) {
            $query->where(function ($query) {
                $query->where('entityable_type', 'team')
                    ->whereOr(function ($query) {
                        $query->where('entityable_type', '<>', 'teamCustomer')
                            ->where('is_internal_visible', 1);
                    });
            });
        }
        if ($type !== null) $query->where('entityable_type', $type);
        $total = $query->count();
        $list = $query->order('id', 'asc')->page($page, $limit)->select()->toArray();
        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $entityId, bool $canReadAll): array
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $entity = \app\model\Entity::with(['profile'])->find($entityId);
        if (!$entity || !$entity->is_valid
            || (!$canReadAll
                && $entity->entityable_type !== 'team'
                && ($entity->entityable_type === 'teamCustomer'
                    || (int) $entity->is_internal_visible !== 1))) {
            throw new HttpException(404, '实体不存在');
        }
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
