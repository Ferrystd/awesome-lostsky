<?php
declare (strict_types = 1);

namespace app\service;

use think\exception\HttpException;
use think\facade\Db;
use think\Request;

class Entity
{
    public function optionsForTeam(int $teamId, bool $canReadAll = false): array
    {
        $subjects = [
            'team' => [$teamId],
            'teamMember' => \app\model\TeamMember::where('team_id', $teamId)->column('id'),
            'teamCustomer' => \app\model\TeamCustomer::where('team_id', $teamId)->column('id'),
            'teamVirtual' => \app\model\TeamVirtual::where('team_id', $teamId)->column('id'),
        ];

        $query = \app\model\Entity::where(function ($query) use ($subjects) {
            foreach ($subjects as $type => $ids) {
                if (!$ids) {
                    continue;
                }
                $query->whereOr(function ($query) use ($type, $ids) {
                    $query->where('entityable_type', $type)->whereIn('entityable_id', $ids);
                });
            }
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

        $items = [];
        foreach ($query->order('id', 'asc')->select() as $entity) {
            if (!$entity->is_valid) {
                continue;
            }
            $summary = app(ChatActor::class)->summaryEntity((int) $entity->id);
            $items[] = [
                'id' => (int) $entity->id,
                'entity_id' => (int) $entity->id,
                'type' => (string) $entity->entityable_type,
                'slug' => $summary['slug'],
                'name' => $summary['name'],
                'avatar' => $summary['avatar'],
            ];
        }

        return $items;
    }

    public function requireBySubject(string $type, int $id): \app\model\Entity
    {
        $entity = \app\model\Entity::where('entityable_type', $type)
            ->where('entityable_id', $id)
            ->find();
        if (!$entity || !$entity->is_valid) {
            throw new HttpException(404, '实体不存在或不可用');
        }

        return $entity;
    }

    public function subject(int $entityId): array
    {
        $entity = \app\model\Entity::find($entityId);
        if (!$entity || !$entity->is_valid) {
            throw new HttpException(404, '实体不存在或不可用');
        }

        return [
            'entity_id' => (int) $entity->id,
            'type' => (string) $entity->entityable_type,
            'id' => (int) $entity->entityable_id,
            'entity' => $entity,
        ];
    }

    public function assertInTeam(int $entityId, int $teamId): \app\model\Entity
    {
        $subject = $this->subject($entityId);
        $actualTeamId = app(IdentitySession::class)->entityTeamId($subject['type'], $subject['id']);
        if ($actualTeamId !== $teamId) {
            throw new HttpException(422, '实体不属于当前团队');
        }

        return $subject['entity'];
    }

    public function assertBelongsToTeam(int $entityId, int $teamId): \app\model\Entity
    {
        $entity = \app\model\Entity::find($entityId);
        if (!$entity) {
            throw new HttpException(404, '实体不存在');
        }
        $actualTeamId = match ((string) $entity->entityable_type) {
            'team' => (int) $entity->entityable_id,
            'teamMember' => (int) (\app\model\TeamMember::find($entity->entityable_id)?->team_id ?? 0),
            'teamCustomer' => (int) (\app\model\TeamCustomer::find($entity->entityable_id)?->team_id ?? 0),
            'teamVirtual' => (int) (\app\model\TeamVirtual::find($entity->entityable_id)?->team_id ?? 0),
            default => 0,
        };
        if ($actualTeamId !== $teamId) {
            throw new HttpException(422, '实体不属于当前团队');
        }
        return $entity;
    }

    public function claimTeam(\app\model\Team $team): \app\model\Entity
    {
        $existing = \app\model\Entity::withTrashed()
            ->team()
            ->where('entityable_id', (int) $team->id)
            ->find();
        if ($existing) {
            return $existing;
        }

        return $this->create('team', (int) $team->id, (string) $team->slug);
    }

    public function claimMember(int $teamId, int $memberId, string $slug): \app\model\Entity
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        return \think\facade\Db::transaction(function () use ($memberId, $slug) {
            $existing = \app\model\Entity::withTrashed()
                ->member()
                ->where('entityable_id', $memberId)
                ->find();
            if ($existing) {
                throw new HttpException(409, "成员标识已经确定：{$existing->slug}");
            }

            return $this->create('teamMember', $memberId, $slug);
        });
    }

    public function claimCustomer(int $customerId, string $slug): \app\model\Entity
    {
        $customer = \app\model\TeamCustomer::find($customerId);
        if (!$customer) {
            throw new HttpException(404, '顾客不存在');
        }

        return \think\facade\Db::transaction(function () use ($customerId, $slug) {
            $existing = \app\model\Entity::withTrashed()
                ->customer()
                ->where('entityable_id', $customerId)
                ->find();
            if ($existing) {
                throw new HttpException(409, "顾客标识已经确定：{$existing->slug}");
            }

            return $this->create('teamCustomer', $customerId, $slug);
        });
    }

    public function claimVirtual(\app\model\TeamVirtual $virtual, string $slug): \app\model\Entity
    {
        return \think\facade\Db::transaction(function () use ($virtual, $slug) {
            $existing = \app\model\Entity::withTrashed()
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

        $identity = \app\model\Entity::member()->where('entityable_id', $memberId)->find();
        if (!$identity) {
            throw new HttpException(422, '请先为成员设置标识');
        }

        $identity->save(['search_override' => $override === null ? null : (int) $override]);
    }

    public function setDisplay(int $teamId, int $entityId, mixed $isDisplayed): void
    {
        if (!in_array($isDisplayed, [0, 1, '0', '1', false, true], true)) {
            throw new HttpException(422, '公开展示设置格式不正确');
        }

        $entity = $this->assertInTeam($entityId, $teamId);
        if (!in_array($entity->entityable_type, ['teamMember', 'teamVirtual'], true)) {
            throw new HttpException(422, '该实体类型不支持公开展示');
        }

        $entity->save(['is_displayed' => (int) (bool) $isDisplayed]);
    }

    public function setInternalVisibility(int $teamId, int $entityId, mixed $isInternalVisible): void
    {
        if (!in_array($isInternalVisible, [0, 1, '0', '1', false, true], true)) {
            throw new HttpException(422, '团队内可见设置格式不正确');
        }

        $entity = $this->assertInTeam($entityId, $teamId);
        if (!in_array($entity->entityable_type, ['teamMember', 'teamVirtual'], true)) {
            throw new HttpException(
                422,
                $entity->entityable_type === 'teamCustomer'
                    ? 'Customer 始终需要 team.entity.read，不支持团队内可见设置'
                    : 'Team 实体始终在团队内部可见'
            );
        }

        $entity->save(['is_internal_visible' => (int) (bool) $isInternalVisible]);
    }

    public function setPresentation(
        int $teamId,
        int $entityId,
        mixed $isInternalVisible,
        mixed $isDisplayed
    ): array {
        if (!in_array($isInternalVisible, [0, 1, '0', '1', false, true], true)) {
            throw new HttpException(422, '团队内可见设置格式不正确');
        }
        if (!in_array($isDisplayed, [0, 1, '0', '1', false, true], true)) {
            throw new HttpException(422, '公开展示设置格式不正确');
        }

        $entity = $this->assertInTeam($entityId, $teamId);
        if (!in_array($entity->entityable_type, ['teamMember', 'teamVirtual'], true)) {
            throw new HttpException(422, '该实体类型不支持调整可见性');
        }

        $result = [
            'is_internal_visible' => (int) (bool) $isInternalVisible,
            'is_displayed' => (int) (bool) $isDisplayed,
        ];
        $entity->save($result);
        return $result;
    }

    public function updatePresentation(
        Request $request,
        int $teamId,
        int $entityId,
        mixed $isInternalVisible,
        mixed $isDisplayed
    ): array {
        return Db::transaction(function () use (
            $request,
            $teamId,
            $entityId,
            $isInternalVisible,
            $isDisplayed
        ): array {
            $result = $this->setPresentation(
                $teamId,
                $entityId,
                $isInternalVisible,
                $isDisplayed
            );
            app(BusinessAudit::class)->record(
                $request,
                'team',
                'update',
                'entity_visibility',
                $entityId,
                [
                    'changed_fields' => ['is_internal_visible', 'is_displayed'],
                    'changes' => [
                        ['field' => 'is_internal_visible', 'after' => (bool) $result['is_internal_visible']],
                        ['field' => 'is_displayed', 'after' => (bool) $result['is_displayed']],
                    ],
                ]
            );
            return $result;
        });
    }

    public function search(string $keyword, int $limit, int $userId): array
    {
        $keyword = strtolower(trim($keyword));
        if (!preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $keyword)) {
            return [];
        }

        $limit = max(1, min(20, $limit));
        $rows  = \app\model\Entity::withSearch(['slug'], ['slug' => $keyword])
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

    // [Copilot] resolve() 现在接收 $teamId，用于区分同团队显式引用与跨团队搜索可见性。
    // 同团队实体只检查 is_valid（文档内显式引用不应受 is_searchable 限制），
    // 跨团队实体仍保留 is_searchable 以控制跨团队可见性。
    public function resolve(array $slugs, int $userId, int $teamId = 0): array
    {
        $slugs = array_values(array_unique(array_filter(array_map(
            fn ($slug) => strtolower(trim((string) $slug)),
            $slugs
        ), fn ($slug) => preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $slug))));
        $slugs = array_slice($slugs, 0, 50);
        if (!$slugs) {
            return [];
        }

        $rows = \app\model\Entity::whereIn('slug', $slugs)->select();
        $this->hydrate($rows->all());
        $map     = [];
        $teamIds = $this->userTeamIds($userId);
        foreach ($rows as $identity) {
            // [Copilot] 同团队实体不卡 is_searchable，显式引用只需要实体有效即可解析。
            $inSameTeam = $teamId > 0 && $this->entityTeamId($identity) === $teamId;
            $available  = $identity->is_valid && ($inSameTeam || $identity->is_searchable);
            $map[$identity->slug] = ($available || $inSameTeam)
                ? $this->summary($identity, $teamIds, $available)
                : $this->unavailable((string) $identity->slug, (string) $identity->entityable_type);
        }

        $result = [];
        foreach ($slugs as $slug) {
            $result[] = $map[$slug] ?? $this->unavailable($slug, 'unknown');
        }
        return $result;
    }

    private function create(string $type, int $id, string $slug): \app\model\Entity
    {
        $validate = new \app\validate\Entity;
        if (!$validate->scene('claim')->check(['slug' => $slug])) {
            throw new HttpException(422, $validate->getError());
        }

        $slug = strtolower(trim($slug));
        if (\app\model\Entity::withTrashed()->where('slug', $slug)->find()) {
            throw new HttpException(409, '对象标识已被占用');
        }

        try {
            $identity = app(\app\model\Entity::class, [], true);
            $identity->save([
                'slug'            => $slug,
                'entityable_type' => $type,
                'entityable_id'   => $id,
                'is_displayed'    => 0,
                'is_internal_visible' => in_array($type, ['team', 'teamMember'], true) ? 1 : 0,
                'search_override' => null,
            ]);
            app(EntityProfile::class)->ensure((int) $identity->id);
            return $identity;
        } catch (\Throwable $exception) {
            $determined = \app\model\Entity::withTrashed()
                ->where('entityable_type', $type)
                ->where('entityable_id', $id)
                ->find();
            if ($determined) {
                throw new HttpException(409, "对象标识已经确定：{$determined->slug}");
            }
            if (\app\model\Entity::withTrashed()->where('slug', $slug)->find()) {
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

        $teams = \app\model\Team::whereIn('id', array_unique($teamIds))
            ->with(['profile'])->select()->column(null, 'id');
        $members = \app\model\TeamMember::whereIn('id', array_unique($memberIds))
            ->with(['profile', 'team.profile'])
            ->select()
            ->column(null, 'id');
        $customers = \app\model\TeamCustomer::whereIn('id', array_unique($customerIds))
            ->with(['profile', 'team.profile'])
            ->select()
            ->column(null, 'id');
        $virtuals = \app\model\TeamVirtual::whereIn('id', array_unique($virtualIds))
            ->with(['profile', 'team.profile'])
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

    private function summary(\app\model\Entity $identity, array $userTeamIds, bool $available): array
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
            'teamCustomer' => $entity->nickname ?: "顾客 #{$entity->id}",
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
            'status_code'  => $type === 'teamMember' ? $entity->status_code : null,
            'status_label' => $type === 'teamMember' ? $entity->status_label : null,
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

    // [Copilot] 从已 hydrate 的 entityable 上提取实体所属团队 ID；
    // 模型字段已有类型转换，不需要手动 (int) 强转。
    private function entityTeamId(\app\model\Entity $identity): int
    {
        $entity = $identity->entityable;
        if ($entity instanceof \app\model\Team) {
            return $entity->id;
        }
        return $entity->team_id ?? 0;
    }

    private function userTeamIds(int $userId): array
    {
        if ($userId <= 0) {
            return [];
        }
        return array_fill_keys(\app\model\TeamMember::where('user_id', $userId)
            ->where('status', \app\enum\TeamMemberStatus::Active->value)
            ->column('team_id'), true);
    }
}
