<?php
declare (strict_types = 1);

namespace app\service;

use think\exception\HttpException;

class EntityIdentity
{
    public function claimTeam(\app\model\Team $team): \app\model\EntityIdentity
    {
        $existing = \app\model\EntityIdentity::withTrashed()
            ->team()
            ->where('entityable_id', (int) $team->id)
            ->find();
        if ($existing) {
            return $existing;
        }

        return $this->create('team', (int) $team->id, (string) $team->slug);
    }

    public function claimMember(int $memberId, string $slug): \app\model\EntityIdentity
    {
        $member = \app\model\TeamMember::find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        return \think\facade\Db::transaction(function () use ($memberId, $slug) {
            $existing = \app\model\EntityIdentity::withTrashed()
                ->member()
                ->where('entityable_id', $memberId)
                ->find();
            if ($existing) {
                throw new HttpException(409, "成员标识已经确定：{$existing->slug}");
            }

            return $this->create('teamMember', $memberId, $slug);
        });
    }

    public function claimCustomer(int $customerId, string $slug): \app\model\EntityIdentity
    {
        $customer = \app\model\TeamCustomer::find($customerId);
        if (!$customer) {
            throw new HttpException(404, '客户不存在');
        }

        return \think\facade\Db::transaction(function () use ($customerId, $slug) {
            $existing = \app\model\EntityIdentity::withTrashed()
                ->customer()
                ->where('entityable_id', $customerId)
                ->find();
            if ($existing) {
                throw new HttpException(409, "客户标识已经确定：{$existing->slug}");
            }

            return $this->create('teamCustomer', $customerId, $slug);
        });
    }

    public function claimVirtual(\app\model\TeamVirtual $virtual, string $slug): \app\model\EntityIdentity
    {
        return \think\facade\Db::transaction(function () use ($virtual, $slug) {
            $existing = \app\model\EntityIdentity::withTrashed()
                ->virtual()
                ->where('entityable_id', (int) $virtual->id)
                ->find();
            if ($existing) {
                throw new HttpException(409, "虚拟实体标识已经确定：{$existing->slug}");
            }

            return $this->create('teamVirtual', (int) $virtual->id, $slug);
        });
    }

    public function setMemberSearch(int $teamId, int $memberId, $override): void
    {
        if (!in_array($override, [null, 0, 1, '0', '1'], true)) {
            throw new HttpException(422, '成员搜索设置格式不正确');
        }

        $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        $identity = \app\model\EntityIdentity::member()->where('entityable_id', $memberId)->find();
        if (!$identity) {
            throw new HttpException(422, '请先为成员设置标识');
        }

        $identity->save(['search_override' => $override === null ? null : (int) $override]);
    }

    public function search(string $keyword, int $limit, int $userId): array
    {
        $keyword = strtolower(trim($keyword));
        if (!preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $keyword)) {
            return [];
        }

        $limit = max(1, min(20, $limit));
        $rows  = \app\model\EntityIdentity::withSearch(['slug'], ['slug' => $keyword])
            ->order('slug', 'asc')
            ->limit(200)
            ->select();

        $this->hydrate($rows->all());
        $teamIds = $this->userTeamIds($userId);
        $result  = [];
        foreach ($rows as $identity) {
            if (!$identity->is_valid || !$identity->is_searchable) {
                continue;
            }
            $result[] = $this->summary($identity, $teamIds, true);
        }

        usort($result, fn (array $a, array $b) => ($b['slug'] === $keyword ? 1 : 0) <=> ($a['slug'] === $keyword ? 1 : 0) ?: strcmp($a['slug'], $b['slug']));
        return array_slice($result, 0, $limit);
    }

    public function resolve(array $slugs, int $userId): array
    {
        $slugs = array_values(array_unique(array_filter(array_map(
            fn ($slug) => strtolower(trim((string) $slug)),
            $slugs
        ), fn ($slug) => preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $slug))));
        $slugs = array_slice($slugs, 0, 50);
        if (!$slugs) {
            return [];
        }

        $rows = \app\model\EntityIdentity::whereIn('slug', $slugs)->select();
        $this->hydrate($rows->all());
        $map     = [];
        $teamIds = $this->userTeamIds($userId);
        foreach ($rows as $identity) {
            $map[$identity->slug] = $identity->is_valid && $identity->is_searchable
                ? $this->summary($identity, $teamIds, true)
                : $this->unavailable((string) $identity->slug, (string) $identity->entityable_type);
        }

        $result = [];
        foreach ($slugs as $slug) {
            $result[] = $map[$slug] ?? $this->unavailable($slug, 'unknown');
        }
        return $result;
    }

    private function create(string $type, int $id, string $slug): \app\model\EntityIdentity
    {
        $validate = new \app\validate\EntityIdentity;
        if (!$validate->scene('claim')->check(['slug' => $slug])) {
            throw new HttpException(422, $validate->getError());
        }

        $slug = strtolower(trim($slug));
        if (\app\model\EntityIdentity::withTrashed()->where('slug', $slug)->find()) {
            throw new HttpException(409, '对象标识已被占用');
        }

        try {
            $identity = app(\app\model\EntityIdentity::class, [], true);
            $identity->save([
                'slug'            => $slug,
                'entityable_type' => $type,
                'entityable_id'   => $id,
                'search_override' => null,
            ]);
            return $identity;
        } catch (\Throwable $exception) {
            $determined = \app\model\EntityIdentity::withTrashed()
                ->where('entityable_type', $type)
                ->where('entityable_id', $id)
                ->find();
            if ($determined) {
                throw new HttpException(409, "对象标识已经确定：{$determined->slug}");
            }
            if (\app\model\EntityIdentity::withTrashed()->where('slug', $slug)->find()) {
                throw new HttpException(409, '对象标识已被占用');
            }
            throw $exception;
        }
    }

    private function hydrate(array $identities): void
    {
        $teamIds = [];
        $memberIds = [];
        $customerIds = [];
        $virtualIds = [];
        foreach ($identities as $identity) {
            if ($identity->entityable_type === 'team') {
                $teamIds[] = (int) $identity->entityable_id;
            } elseif ($identity->entityable_type === 'teamMember') {
                $memberIds[] = (int) $identity->entityable_id;
            } elseif ($identity->entityable_type === 'teamCustomer') {
                $customerIds[] = (int) $identity->entityable_id;
            } elseif ($identity->entityable_type === 'teamVirtual') {
                $virtualIds[] = (int) $identity->entityable_id;
            }
        }

        $teams = \app\model\Team::whereIn('id', array_unique($teamIds))->select()->column(null, 'id');
        $members = \app\model\TeamMember::whereIn('id', array_unique($memberIds))
            ->with(['profile', 'team'])
            ->select()
            ->column(null, 'id');
        $customers = \app\model\TeamCustomer::whereIn('id', array_unique($customerIds))
            ->with(['profile', 'team'])
            ->select()
            ->column(null, 'id');
        $virtuals = \app\model\TeamVirtual::whereIn('id', array_unique($virtualIds))
            ->with(['team'])
            ->select()
            ->column(null, 'id');

        $settingTeamIds = array_keys($teams);
        foreach ($members as $member) {
            $settingTeamIds[] = (int) $member->team_id;
        }
        foreach ($customers as $customer) {
            $settingTeamIds[] = (int) $customer->team_id;
        }
        foreach ($virtuals as $virtual) {
            $settingTeamIds[] = (int) $virtual->team_id;
        }
        $settings = app(\app\service\TeamSetting::class)->internalMany($settingTeamIds, 'entity');

        foreach ($teams as $team) {
            $team->entitySearchSettings = $settings[(int) $team->id] ?? [];
        }
        foreach ($members as $member) {
            $team = $member->team;
            if ($team) {
                $team->entitySearchSettings = $settings[(int) $team->id] ?? [];
            }
        }
        foreach ($identities as $identity) {
            $entity = match ($identity->entityable_type) {
                'team' => $teams[(int) $identity->entityable_id] ?? null,
                'teamMember' => $members[(int) $identity->entityable_id] ?? null,
                'teamCustomer' => $customers[(int) $identity->entityable_id] ?? null,
                'teamVirtual' => $virtuals[(int) $identity->entityable_id] ?? null,
                default => null,
            };
            if ($entity instanceof \app\model\TeamMember
                || $entity instanceof \app\model\TeamCustomer
                || $entity instanceof \app\model\TeamVirtual) {
                $entity->setRelation('identity', $identity);
            }
            $identity->setRelation('entityable', $entity);
        }
    }

    private function summary(\app\model\EntityIdentity $identity, array $userTeamIds, bool $available): array
    {
        $entity = $identity->entityable;
        if ($entity instanceof \app\model\Team) {
            return [
                'slug'         => $identity->slug,
                'type'         => 'team',
                'display_name' => $entity->display_name ?: $identity->slug,
                'avatar'       => null,
                'team'         => null,
                'available'    => $available,
                'href'         => "//{$entity->slug}.team.lostsky.work/",
            ];
        }

        $team = $entity->team;
        $type = match (true) {
            $entity instanceof \app\model\TeamCustomer => 'teamCustomer',
            $entity instanceof \app\model\TeamVirtual => 'teamVirtual',
            default => 'teamMember',
        };
        $displayName = match ($type) {
            'teamCustomer' => $entity->nickname ?: "客户 #{$entity->id}",
            'teamVirtual' => $entity->name ?: $identity->slug,
            default => $entity->nickname ?: "成员 #{$entity->id}",
        };
        return [
            'slug'         => $identity->slug,
            'type'         => $type,
            'display_name' => $displayName,
            'avatar'       => $entity->avatar ?: null,
            'team'         => $team ? ['slug' => $team->slug, 'display_name' => $team->display_name] : null,
            'available'    => $available,
            'href'         => $type === 'teamMember' && $team && isset($userTeamIds[(int) $team->id])
                ? "//{$team->slug}.team.lostsky.work/member-detail?id={$entity->id}"
                : null,
        ];
    }

    private function unavailable(string $slug, string $type): array
    {
        return [
            'slug'         => $slug,
            'type'         => in_array($type, ['team', 'teamMember', 'teamCustomer', 'teamVirtual'], true) ? $type : 'unknown',
            'display_name' => $slug,
            'avatar'       => null,
            'team'         => null,
            'available'    => false,
            'href'         => null,
        ];
    }

    private function userTeamIds(int $userId): array
    {
        if ($userId <= 0) {
            return [];
        }
        return array_fill_keys(\app\model\TeamMember::where('user_id', $userId)
            ->where('is_blocked', 0)
            ->column('team_id'), true);
    }
}
