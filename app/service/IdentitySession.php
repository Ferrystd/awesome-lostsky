<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use app\model\EntitySession;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
use app\model\UserDevice;
use app\enum\TeamMemberStatus;
use think\exception\HttpException;

class IdentitySession
{
    public function revokeInactiveMembers(int $teamId): void
    {
        $memberIds = TeamMember::where('team_id', $teamId)
            ->whereIn('status', [TeamMemberStatus::Blocked->value, TeamMemberStatus::Departed->value])
            ->column('id');
        if (!$memberIds) {
            return;
        }

        $entityIds = Entity::member()->whereIn('entityable_id', $memberIds)->column('id');
        $this->revokeForEntities(array_map('intval', $entityIds));
    }

    public function revokeForEntities(array $entityIds): void
    {
        $entityIds = array_values(array_unique(array_filter(array_map('intval', $entityIds))));
        if (!$entityIds) {
            return;
        }

        $frontier = EntitySession::whereIn('entity_id', $entityIds)
            ->whereNull('revoked_at')
            ->column('id');
        $sessionIds = [];
        while ($frontier) {
            $frontier = array_values(array_diff(array_unique(array_map('intval', $frontier)), $sessionIds));
            if (!$frontier) {
                break;
            }
            $sessionIds = array_merge($sessionIds, $frontier);
            $frontier = EntitySession::whereIn('parent_session_id', $frontier)
                ->whereNull('revoked_at')
                ->column('id');
        }

        if ($sessionIds) {
            EntitySession::whereIn('id', array_values(array_unique($sessionIds)))
                ->whereNull('revoked_at')
                ->update(['revoked_at' => time()]);
        }
    }
    public function candidates(int $userId, ?EntitySession $current = null): array
    {
        return $current
            ? $this->delegatedCandidates($current)
            : $this->rootCandidates($userId);
    }

    public function receive(
        int $userId,
        string $deviceToken,
        string $slug,
        ?EntitySession $current = null
    ): array {
        $identity = $this->identityBySlug($slug);
        $type = (string) $identity->entityable_type;
        $id = (int) $identity->entityable_id;

        if ($current) {
            $targetTeamId = $this->entityTeamId($type, $id);
            $sourceEntity = $current->subject;
            $source = [
                'entity_id' => (int) $sourceEntity->id,
                'type' => (string) $sourceEntity->entityable_type,
                'id' => (int) $sourceEntity->entityable_id,
            ];
            if ($targetTeamId < 1
                || (!app(PermissionGate::class)->delegatedAllows($targetTeamId, $source, $identity)
                    && !$this->boundCustomerAllows((int) $sourceEntity->id, $identity))) {
                throw new HttpException(403, '当前实体没有领取该身份的权限');
            }
            $issued = $this->issueDelegated(
                $userId,
                $deviceToken,
                $current,
                $identity
            );
        } else {
            if (!$this->rootAllows($type, $id, $userId)) {
                throw new HttpException(403, '你不能直接领取该身份');
            }
            $issued = $this->issueRoot(
                $userId,
                $deviceToken,
                $identity
            );
        }

        return $this->publicIssue($issued);
    }

    public function receiveMember(int $userId, string $deviceToken, string $teamSlug): array
    {
        $team = Team::active()
            ->where('slug', strtolower(trim($teamSlug)))
            ->find();
        if (!$team) {
            throw new HttpException(404, '团队不存在或不可用');
        }

        $member = TeamMember::where('team_id', (int) $team->id)
            ->where('user_id', $userId)
            ->where('status', TeamMemberStatus::Active->value)
            ->with(['identity'])
            ->find();
        if (!$member || !$member->canDirectReceive() || !$member->identity) {
            throw new HttpException(403, '你没有该团队的有效成员身份');
        }

        return $this->publicIssue($this->issueRoot(
            $userId,
            $deviceToken,
            $member->identity
        ));
    }

    public function receiveBoundCustomer(
        int $userId,
        string $deviceToken,
        TeamCustomer $customer,
        ?EntitySession $current
    ): array {
        $identity = $customer->identity;
        if (!$identity || !$identity->is_valid) {
            throw new HttpException(403, '顾客身份不可用');
        }

        if ($current) {
            if ((int) ($customer->owner_entity_id ?? 0) !== (int) $current->entity_id) {
                throw new HttpException(403, '当前实体不能领取该顾客身份');
            }
            return $this->publicIssue($this->issueDelegated(
                $userId,
                $deviceToken,
                $current,
                $identity
            ));
        }

        if ((int) ($customer->user_id ?? 0) !== $userId) {
            throw new HttpException(403, '当前用户不能领取该顾客身份');
        }

        return $this->publicIssue($this->issueRoot(
            $userId,
            $deviceToken,
            $identity
        ));
    }

    public function customerIdentity(TeamCustomer $customer): array
    {
        $identity = $customer->identity;
        if (!$identity) {
            throw new HttpException(404, '顾客身份不存在');
        }
        return $this->itemFromIdentity($identity) ?? [];
    }

    public function publicIssue(array $issued): array
    {
        return [
            'token' => (string) $issued['token'],
            'identity' => $issued['identity'],
        ];
    }

    public function drop(int $userId, string $deviceToken, string $jti = ''): array
    {
        if ($jti !== '') {
            EntitySession::where('user_id', $userId)
                ->where('device_token', $deviceToken)
                ->where('jti', $jti)
                ->whereNull('revoked_at')
                ->whereNull('superseded_at')
                ->update(['revoked_at' => time()]);
        }

        return ['token' => app(Jwt::class)->createToken($userId, $deviceToken)];
    }

    public function session(
        int $userId,
        string $deviceToken,
        string $jti,
        string $type,
        int $id
    ): EntitySession {
        $entity = Entity::where('entityable_type', $type)->where('entityable_id', $id)->find();
        if (!$entity) {
            throw new HttpException(401, '实体身份会话已失效');
        }
        $session = EntitySession::where('user_id', $userId)
            ->where('device_token', $deviceToken)
            ->where('jti', $jti)
            ->where('entity_id', (int) $entity->id)
            ->whereNull('revoked_at')
            ->whereNull('superseded_at')
            ->where('expires_at', '>', time())
            ->find();

        if (!$session || !$this->validChain($session, $userId, $deviceToken)) {
            throw new HttpException(401, '实体身份会话已失效');
        }

        return $session;
    }

    public function entityTeamId(string $type, int $id): int
    {
        return match ($type) {
            'team' => (int) (Team::active()->find($id)?->id ?? 0),
            'teamMember' => $this->memberTeamId($id),
            'teamCustomer' => (int) (TeamCustomer::where('is_blocked', 0)->find($id)?->team_id ?? 0),
            'teamVirtual' => (int) (TeamVirtual::where('is_active', 1)->find($id)?->team_id ?? 0),
            default => 0,
        };
    }

    public function assumePermissionKeys(Entity $target): array
    {
        $type = (string) $target->entityable_type;
        if ($type === 'team') {
            return [PermissionDictionary::IDENTITY_TEAM_ASSUME];
        }

        $segment = match ($type) {
            'teamMember' => 'member',
            'teamCustomer' => 'customer',
            'teamVirtual' => 'virtual',
            default => '',
        };
        $slug = (string) $target->slug;
        if ($segment === '' || $slug === '') {
            return [];
        }

        return [
            PermissionDictionary::assume($segment, $slug),
            PermissionDictionary::assume($segment),
        ];
    }

    public function entityName(string $type, int $id): string
    {
        $fallback = match ($type) {
            'team' => '团队',
            'teamVirtual' => '虚拟实体',
            'teamMember' => "成员 #{$id}",
            'teamCustomer' => "顾客 #{$id}",
            default => '实体',
        };

        $entity = Entity::with('profile')
            ->where('entityable_type', $type)
            ->where('entityable_id', $id)
            ->find();

        return (string) ($entity?->profile?->name ?: $fallback);
    }

    public function teamSummary(int $teamId): ?array
    {
        $team = Team::active()->find($teamId);
        if (!$team) {
            return null;
        }

        return [
            'id' => (int) $team->id,
            'slug' => (string) $team->slug,
            'name' => $this->entityName('team', $teamId),
        ];
    }

    public function currentTarget(?array $actingEntity): array
    {
        if (!$actingEntity) {
            return ['kind' => 'identity', 'team' => null];
        }

        $type = (string) ($actingEntity['type'] ?? '');
        $teamId = $this->entityTeamId($type, (int) ($actingEntity['id'] ?? 0));
        if ($teamId < 1) {
            throw new HttpException(401, '当前实体所属团队不可用');
        }

        return [
            'kind' => match ($type) {
                'team', 'teamMember', 'teamVirtual' => 'team-personal',
                'teamCustomer' => 'shop-customer',
                default => 'identity',
            },
            'team' => $this->teamSummary($teamId),
        ];
    }

    private function rootCandidates(int $userId): array
    {
        $items = [];
        $members = TeamMember::where('user_id', $userId)
            ->where('status', TeamMemberStatus::Active->value)
            ->with(['identity', 'profile'])
            ->select();
        foreach ($members as $member) {
            if ($member->canDirectReceive() && $member->identity) {
                $item = $this->itemFromIdentity($member->identity);
                if ($item) {
                    $items[$item['slug']] = $item;
                }
            }
        }

        $customers = TeamCustomer::where('user_id', $userId)
            ->where('is_blocked', 0)
            ->with(['identity', 'profile'])
            ->select();
        foreach ($customers as $customer) {
            if ($customer->identity && $customer->identity->is_valid) {
                $item = $this->itemFromIdentity($customer->identity);
                if ($item) {
                    $items[$item['slug']] = $item;
                }
            }
        }

        return array_values($items);
    }

    private function delegatedCandidates(EntitySession $current): array
    {
        $bindings = TeamEntityRole::where('entity_id', (int) $current->entity_id)
            ->select();
        $rolesByTeam = [];
        foreach ($bindings as $binding) {
            $rolesByTeam[(int) $binding->team_id][] = (int) $binding->role_id;
        }

        $items = [];
        foreach ($rolesByTeam as $teamId => $roleIds) {
            $keys = TeamRolePermission::where('team_id', $teamId)
                ->whereIn('role_id', array_values(array_unique($roleIds)))
                ->whereLike('permission_key', 'identity.%')
                ->column('permission_key');
            if (!$keys) {
                continue;
            }

            if (in_array(PermissionDictionary::IDENTITY_TEAM_ASSUME, $keys, true)) {
                $teamIdentity = Entity::team()->where('entityable_id', $teamId)->find();
                $this->addCandidate($items, $teamIdentity);
            }

            foreach ([
                'member' => 'teamMember',
                'customer' => 'teamCustomer',
                'virtual' => 'teamVirtual',
            ] as $segment => $type) {
                if (in_array(PermissionDictionary::assume($segment), $keys, true)) {
                    foreach ($this->teamIdentities($teamId, $type) as $identity) {
                        $this->addCandidate($items, $identity);
                    }
                }

                $slugs = [];
                foreach ($keys as $key) {
                    if (preg_match("/^identity\\.{$segment}\\.([a-z0-9][a-z0-9_-]{0,49})\\.assume$/", $key, $match)) {
                        $slugs[] = $match[1];
                    }
                }
                if ($slugs) {
                    $identities = Entity::where('entityable_type', $type)
                        ->whereIn('slug', array_values(array_unique($slugs)))
                        ->select();
                    foreach ($identities as $identity) {
                        if ($this->entityTeamId($type, (int) $identity->entityable_id) === $teamId) {
                            $this->addCandidate($items, $identity);
                        }
                    }
                }
            }
        }

        $boundCustomerIds = TeamCustomer::where('owner_entity_id', (int) $current->entity_id)
            ->where('is_blocked', 0)
            ->column('id');
        if ($boundCustomerIds) {
            foreach (Entity::customer()->whereIn('entityable_id', $boundCustomerIds)->select() as $identity) {
                $this->addCandidate($items, $identity);
            }
        }

        ksort($items);
        return array_values($items);
    }

    private function teamIdentities(int $teamId, string $type): array
    {
        $ids = match ($type) {
            'teamMember' => TeamMember::where('team_id', $teamId)
                ->column('id'),
            'teamCustomer' => TeamCustomer::where('team_id', $teamId)
                ->where('is_blocked', 0)
                ->column('id'),
            'teamVirtual' => TeamVirtual::where('team_id', $teamId)
                ->where('is_active', 1)
                ->column('id'),
            default => [],
        };
        if (!$ids) {
            return [];
        }

        return Entity::where('entityable_type', $type)
            ->whereIn('entityable_id', $ids)
            ->select()
            ->all();
    }

    private function addCandidate(array &$items, ?Entity $identity): void
    {
        if (!$identity || !$identity->is_valid) {
            return;
        }
        $item = $this->itemFromIdentity($identity);
        if ($item) {
            $items[$item['slug']] = $item;
        }
    }

    private function itemFromIdentity(Entity $identity): ?array
    {
        $type = (string) $identity->entityable_type;
        $id = (int) $identity->entityable_id;
        $teamId = $this->entityTeamId($type, $id);
        if ($teamId < 1 || !$identity->is_valid || (string) $identity->slug === '') {
            return null;
        }

        return [
            'type' => $type,
            'id' => $id,
            'slug' => (string) $identity->slug,
            'name' => $this->entityName($type, $id),
            'status_code' => $identity->status_code,
            'status_label' => $identity->status_label,
            'team' => $this->teamSummary($teamId),
        ];
    }

    private function identityBySlug(string $slug): Entity
    {
        $slug = strtolower(trim($slug));
        if (!preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $slug)) {
            throw new HttpException(422, '实体 slug 格式不正确');
        }

        $identity = Entity::where('slug', $slug)->find();
        if (!$identity || !$identity->is_valid) {
            throw new HttpException(404, '实体身份不存在或不可用');
        }

        return $identity;
    }

    private function rootAllows(string $type, int $id, int $userId): bool
    {
        return match ($type) {
            'teamMember' => $this->memberRootAllows($id, $userId),
            'teamCustomer' => (bool) TeamCustomer::where('id', $id)
                ->where('user_id', $userId)
                ->where('is_blocked', 0)
                ->find(),
            default => false,
        };
    }

    private function memberTeamId(int $id): int
    {
        $member = TeamMember::find($id);
        return $member && $member->is_valid ? (int) $member->team_id : 0;
    }

    private function memberRootAllows(int $id, int $userId): bool
    {
        $member = TeamMember::where('id', $id)->where('user_id', $userId)->find();
        return $member ? $member->canDirectReceive() : false;
    }

    private function validChain(EntitySession $leaf, int $userId, string $deviceToken): bool
    {
        $current = $leaf;
        $visited = [];
        $now = time();

        while ($current) {
            $sessionId = (int) $current->id;
            if ($sessionId < 1 || isset($visited[$sessionId])
                || (int) $current->user_id !== $userId
                || (string) $current->device_token !== $deviceToken
                || $current->revoked_at !== null
                || (int) $current->expires_at <= $now) {
                return false;
            }
            $visited[$sessionId] = true;

            $target = $current->subject;
            if (!$target || !$target->is_valid) {
                return false;
            }

            $parentId = (int) ($current->parent_session_id ?? 0);
            if ($parentId < 1) {
                return $this->rootAllows(
                    (string) $target->entityable_type,
                    (int) $target->entityable_id,
                    $userId
                );
            }
            if ($parentId >= $sessionId) {
                return false;
            }

            $parent = EntitySession::find($parentId);
            if (!$parent
                || $parent->superseded_at === null
                || (int) $current->expires_at > (int) $parent->expires_at) {
                return false;
            }

            $targetTeamId = $this->entityTeamId(
                (string) $target->entityable_type,
                (int) $target->entityable_id
            );
            $parentEntity = $parent->subject;
            if (!$parentEntity) {
                return false;
            }
            $source = [
                'entity_id' => (int) $parentEntity->id,
                'type' => (string) $parentEntity->entityable_type,
                'id' => (int) $parentEntity->entityable_id,
            ];
            if ($targetTeamId < 1
                || (!app(PermissionGate::class)->delegatedAllows($targetTeamId, $source, $target)
                    && !$this->boundCustomerAllows((int) $parentEntity->id, $target))) {
                return false;
            }

            $current = $parent;
        }

        return false;
    }

    private function boundCustomerAllows(int $sourceEntityId, Entity $target): bool
    {
        if ((string) $target->entityable_type !== 'teamCustomer') {
            return false;
        }

        return (bool) TeamCustomer::where('id', (int) $target->entityable_id)
            ->where('owner_entity_id', $sourceEntityId)
            ->where('is_blocked', 0)
            ->find();
    }

    private function issueRoot(
        int $userId,
        string $deviceToken,
        Entity $identity
    ): array {
        $expiresAt = time() + (int) config('jwt.ttl');
        $session = EntitySession::transaction(function () use (
            $userId,
            $deviceToken,
            $identity,
            $expiresAt
        ) {
            $this->lockDevice($userId, $deviceToken);
            EntitySession::where('user_id', $userId)
                ->where('device_token', $deviceToken)
                ->whereNull('revoked_at')
                ->whereNull('superseded_at')
                ->update(['revoked_at' => time()]);

            return $this->createSession(
                $userId,
                $deviceToken,
                null,
                $identity,
                $expiresAt
            );
        });

        return $this->issued($session, $identity);
    }

    private function issueDelegated(
        int $userId,
        string $deviceToken,
        EntitySession $current,
        Entity $identity
    ): array {
        $session = EntitySession::transaction(function () use (
            $userId,
            $deviceToken,
            $current,
            $identity
        ) {
            $this->lockDevice($userId, $deviceToken);
            $locked = EntitySession::where('id', (int) $current->id)
                ->where('user_id', $userId)
                ->where('device_token', $deviceToken)
                ->whereNull('revoked_at')
                ->whereNull('superseded_at')
                ->where('expires_at', '>', time())
                ->lock(true)
                ->find();
            if (!$locked || !$this->validChain($locked, $userId, $deviceToken)) {
                throw new HttpException(401, '当前实体身份会话已失效');
            }

            $locked->superseded_at = time();
            $locked->save();

            return $this->createSession(
                $userId,
                $deviceToken,
                (int) $locked->id,
                $identity,
                (int) $locked->expires_at
            );
        });

        return $this->issued($session, $identity);
    }

    private function createSession(
        int $userId,
        string $deviceToken,
        ?int $parentSessionId,
        Entity $identity,
        int $expiresAt
    ): EntitySession {
        $session = app(EntitySession::class, [], true);
        $session->save([
            'user_id' => $userId,
            'device_token' => $deviceToken,
            'jti' => bin2hex(random_bytes(24)),
            'parent_session_id' => $parentSessionId,
            'entity_id' => (int) $identity->id,
            'expires_at' => $expiresAt,
            'superseded_at' => null,
            'revoked_at' => null,
        ]);

        return $session;
    }

    private function issued(EntitySession $session, Entity $identity): array
    {
        return [
            'token' => app(Jwt::class)->createToken(
                (int) $session->user_id,
                (string) $session->device_token,
                [
                    'aud' => 'lostsky',
                    'jti' => (string) $session->jti,
                    'act' => [
                        'type' => (string) $identity->entityable_type,
                        'id' => (int) $identity->entityable_id,
                    ],
                ],
                (int) $session->expires_at
            ),
            'identity' => $this->itemFromIdentity($identity),
            'session' => $session,
        ];
    }

    private function lockDevice(int $userId, string $deviceToken): UserDevice
    {
        if ($deviceToken === '') {
            throw new HttpException(401, '登录设备信息不完整');
        }
        $device = UserDevice::where('user_id', $userId)
            ->where('device_token', $deviceToken)
            ->lock(true)
            ->find();
        if (!$device) {
            throw new HttpException(401, '设备已被取消授权，请重新登录');
        }

        return $device;
    }
}
