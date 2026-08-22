<?php
declare(strict_types=1);

namespace app\service;

use app\model\BusinessAuditEvent;
use app\model\PlatformAdminUserRole;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamAbilityGrant;
use app\model\User;
use app\model\UserDevice;
use think\exception\HttpException;
use think\facade\Cache;
use think\facade\Db;
use think\Request;

final class PlatformAdmin
{
    public function dashboard(int $userId): array
    {
        $since = time() - 7 * 86400;
        $access = app(PlatformAdminAccess::class);
        return [
            'counts' => [
                'users' => User::count(),
                'new_users_7d' => User::where('create_time', '>=', $since)->count(),
                'banned_users' => User::where('is_banned', 1)->count(),
                'teams' => Team::count(),
                'new_teams_7d' => Team::where('create_time', '>=', $since)->count(),
                'banned_teams' => Team::where('is_banned', 1)->count(),
                'administrators' => count($access->administrators()),
                'active_sessions' => UserDevice::count(),
            ],
            'recent_users' => $access->has($userId, PermissionDictionary::ADMIN_USER_READ)
                ? $this->users(['limit' => 5, 'page' => 1])['list']
                : [],
            'recent_teams' => $access->has($userId, PermissionDictionary::ADMIN_TEAM_READ)
                ? $this->teams(['limit' => 5, 'page' => 1])['list']
                : [],
            'recent_audit_events' => $access->has($userId, PermissionDictionary::ADMIN_AUDIT_READ)
                ? $this->auditEvents(['limit' => 8, 'page' => 1])['list']
                : [],
        ];
    }

    public function search(string $keyword, int $userId): array
    {
        $keyword = trim($keyword);
        if (mb_strlen($keyword) < 2) {
            return ['users' => [], 'teams' => []];
        }
        $access = app(PlatformAdminAccess::class);
        $includeSensitive = $access->has(
            $userId,
            PermissionDictionary::ADMIN_USER_SENSITIVE_READ
        );
        return [
            'users' => $access->has($userId, PermissionDictionary::ADMIN_USER_READ)
                ? $this->users(
                    ['q' => $keyword, 'limit' => 5, 'page' => 1],
                    $includeSensitive
                )['list']
                : [],
            'teams' => $access->has($userId, PermissionDictionary::ADMIN_TEAM_READ)
                ? $this->teams(['q' => $keyword, 'limit' => 5, 'page' => 1])['list']
                : [],
        ];
    }

    public function users(array $filters, bool $includeSensitive = false): array
    {
        [$page, $limit] = app(Pagination::class)->normalize(
            (int) ($filters['page'] ?? 1),
            (int) ($filters['limit'] ?? Pagination::DEFAULT_LIMIT)
        );
        $query = User::alias('user')
            ->withJoin(['profile' => ['nickname', 'avatar']], 'LEFT')
            ->withCount(['members' => 'team_count', 'devices' => 'device_count']);
        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $pattern = "%{$keyword}%";
            $where = '(`user`.`username` LIKE ? OR `profile`.`nickname` LIKE ?';
            $bindings = [$pattern, $pattern];
            if ($includeSensitive) {
                $where .= ' OR `user`.`phone` LIKE ? OR `user`.`email` LIKE ?';
                $bindings[] = $pattern;
                $bindings[] = $pattern;
            }
            if (ctype_digit($keyword)) {
                $where .= ' OR `user`.`id` = ?';
                $bindings[] = (int) $keyword;
            }
            $query->whereRaw($where . ')', $bindings);
        }
        $status = (string) ($filters['status'] ?? '');
        if ($status === 'active' || $status === 'banned') {
            $query->where('user.is_banned', $status === 'banned' ? 1 : 0);
        }
        $paginator = $query
            ->order('user.id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection()->toArray();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();
        foreach ($rows as &$row) {
            $phone = (string) ($row['phone'] ?? '');
            $email = (string) ($row['email'] ?? '');
            $row['phone_masked'] = $this->maskPhone($phone);
            $row['email_masked'] = $this->maskEmail($email);
            if (!$includeSensitive) {
                unset($row['phone'], $row['email']);
            }
            $row['team_count'] = (int) ($row['team_count'] ?? 0);
            $row['device_count'] = (int) ($row['device_count'] ?? 0);
        }

        return ['total' => $total, 'list' => $rows, 'page' => $page, 'limit' => $limit];
    }

    public function user(int $id, bool $includeSensitive = false): array
    {
        $result = $this->users(['q' => (string) $id, 'limit' => 20], $includeSensitive);
        $data = null;
        foreach ($result['list'] as $candidate) {
            if ((int) $candidate['id'] === $id) {
                $data = $candidate;
                break;
            }
        }
        if (!$data) {
            throw new HttpException(404, '用户不存在');
        }
        $data['teams'] = Db::name('team_member')
            ->alias('member')
            ->join('team team', 'team.id = member.team_id')
            ->where('member.user_id', $id)
            ->whereNull('member.delete_time')
            ->field('team.id,team.slug,team.is_banned,team.is_cancelled,member.create_time')
            ->order('member.id', 'desc')
            ->select()
            ->toArray();
        $data['devices'] = UserDevice::where('user_id', $id)
            ->field('id,device_name,ua,last_active_time,create_time')
            ->order('last_active_time', 'desc')
            ->select()
            ->toArray();
        $data['roles'] = array_values(array_filter(
            app(PlatformAdminAccess::class)->administrators(),
            static fn (array $admin): bool => (int) $admin['id'] === $id
        ))[0]['roles'] ?? [];
        $data['audit_events'] = $this->auditEvents([
            'resource_type' => 'user',
            'resource_id' => $id,
            'limit' => 20,
        ])['list'];

        return $data;
    }

    public function moderateUser(
        int $actorUserId,
        int $targetUserId,
        bool $banned,
        string $reason,
        Request $request
    ): void {
        $reason = $this->reason($reason);
        if ($actorUserId === $targetUserId) {
            throw new HttpException(409, '不能封禁或解封自己的账号');
        }
        Db::transaction(function () use ($actorUserId, $targetUserId, $banned, $reason, $request): void {
            $user = User::where('id', $targetUserId)->lock(true)->find();
            if (!$user) {
                throw new HttpException(404, '用户不存在');
            }
            if ((int) $user->is_banned === (int) $banned) {
                return;
            }
            if ($banned && $this->isSuperAdmin($targetUserId)) {
                app(PlatformAdminAccess::class)->assertAnotherActiveSuperAdmin($targetUserId);
            }
            $before = (int) $user->is_banned;
            $user->is_banned = $banned ? 1 : 0;
            $user->save();
            if ($banned) {
                app(Device::class)->quitAll($targetUserId);
            }
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                $banned ? 'user.ban' : 'user.unban',
                'user',
                $targetUserId,
                ['reason' => $reason, 'before' => $before, 'after' => (int) $banned],
                $request
            );
        });
    }

    public function revokeUserSessions(
        int $actorUserId,
        int $targetUserId,
        string $reason,
        Request $request
    ): void {
        $reason = $this->reason($reason);
        if (!User::find($targetUserId)) {
            throw new HttpException(404, '用户不存在');
        }
        Db::transaction(function () use ($actorUserId, $targetUserId, $reason, $request): void {
            app(Device::class)->quitAll($targetUserId);
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                'user.sessions.revoke',
                'user',
                $targetUserId,
                ['reason' => $reason],
                $request
            );
        });
    }

    public function teams(array $filters): array
    {
        [$page, $limit] = app(Pagination::class)->normalize(
            (int) ($filters['page'] ?? 1),
            (int) ($filters['limit'] ?? Pagination::DEFAULT_LIMIT)
        );
        $query = Db::name('team')->alias('team')
            ->leftJoin('user owner', 'owner.id = team.user_id')
            ->leftJoin('entity identity', "identity.entityable_type = 'team' AND identity.entityable_id = team.id AND identity.delete_time IS NULL")
            ->leftJoin('team_entity_profile profile', 'profile.entity_id = identity.id AND profile.delete_time IS NULL')
            ->whereNull('team.delete_time');
        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            $pattern = "%{$keyword}%";
            $where = '(`team`.`slug` LIKE ? OR `profile`.`name` LIKE ? OR `owner`.`username` LIKE ?';
            $bindings = [$pattern, $pattern, $pattern];
            if (ctype_digit($keyword)) {
                $where .= ' OR `team`.`id` = ?';
                $bindings[] = (int) $keyword;
            }
            $query->whereRaw($where . ')', $bindings);
        }
        $status = (string) ($filters['status'] ?? '');
        if (in_array($status, ['active', 'banned', 'cancelled'], true)) {
            if ($status === 'active') {
                $query->where('team.is_banned', 0)->where('team.is_cancelled', 0);
            } elseif ($status === 'banned') {
                $query->where('team.is_banned', 1);
            } else {
                $query->where('team.is_cancelled', 1);
            }
        }
        $paginator = $query->field([
            'team.id', 'team.slug', 'team.user_id', 'team.is_banned', 'team.is_cancelled',
            'team.create_time', 'team.update_time', 'profile.name', 'profile.avatar',
            'owner.username owner_username',
        ])->order('team.id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection()->toArray();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();
        foreach ($rows as &$row) {
            $row['member_count'] = Db::name('team_member')
                ->where('team_id', $row['id'])->whereNull('delete_time')->count();
        }

        return ['total' => $total, 'list' => $rows, 'page' => $page, 'limit' => $limit];
    }

    public function team(int $id): array
    {
        $result = $this->teams(['q' => (string) $id, 'limit' => 20]);
        $data = null;
        foreach ($result['list'] as $candidate) {
            if ((int) $candidate['id'] === $id) {
                $data = $candidate;
                break;
            }
        }
        if (!$data) {
            throw new HttpException(404, '团队不存在');
        }
        $data['domains'] = Db::name('team_domain')->where('team_id', $id)
            ->whereNull('delete_time')->field('id,domain,app,create_time')->select()->toArray();
        $data['abilities'] = Db::name('team_ability')->where('team_id', $id)
            ->whereNull('delete_time')->field('id,ability_key,level,expire_time')->select()->toArray();
        $data['ability_catalog'] = AbilityCatalog::all();
        $data['audit_events'] = $this->auditEvents([
            'resource_type' => 'team',
            'resource_id' => $id,
            'limit' => 20,
        ])['list'];

        return $data;
    }

    public function grantTeamAbility(
        int $actorUserId,
        int $teamId,
        string $abilityKey,
        int $level,
        int $expireTime,
        ?Request $request = null,
        bool $enforceCatalogLevels = true
    ): array {
        $abilityKey = trim($abilityKey);
        $catalog = null;
        foreach (AbilityCatalog::all() as $item) {
            if ($item['key'] === $abilityKey) {
                $catalog = $item;
                break;
            }
        }
        if (!$catalog
            || $level < 1
            || ($enforceCatalogLevels && !in_array($level, $catalog['levels'], true))
            || $expireTime < 0
            || $expireTime > 4294967295) {
            throw new HttpException(422, '请选择有效的 Ability、等级和到期时间');
        }

        return Db::transaction(function () use (
            $actorUserId,
            $teamId,
            $abilityKey,
            $level,
            $expireTime,
            $request
        ): array {
            $team = Team::where('id', $teamId)->lock(true)->find();
            if (!$team) {
                throw new HttpException(404, '团队不存在');
            }
            if ((int) $team->is_cancelled === 1) {
                throw new HttpException(409, '已注销团队不能开通能力');
            }

            TeamAbilityGrant::where('team_id', $teamId)
                ->where('ability_key', $abilityKey)
                ->where('source_type', 'manual')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => time(), 'revoke_reason' => 'replaced']);
            $grant = new TeamAbilityGrant;
            $grant->save([
                'team_id' => $teamId,
                'ability_key' => $abilityKey,
                'level' => $level,
                'starts_at' => time(),
                'ends_at' => $expireTime,
                'source_type' => 'manual',
            ]);
            app(AbilityResolver::class)->syncProjection($teamId, $abilityKey);
            app(AbilityExpirationScheduler::class)->schedule($grant);
            $ability = TeamAbility::where('team_id', $teamId)
                ->where('ability_key', $abilityKey)->find();

            app(BusinessAudit::class)->recordPlatform(
                $actorUserId > 0 ? $actorUserId : null,
                'ability.grant',
                'team_ability',
                (int) $ability->id,
                [
                    'team_id' => $teamId,
                    'ability_key' => $abilityKey,
                    'level' => $level,
                    'expire_time' => $expireTime,
                ],
                $request
            );

            return $ability->toArray();
        });
    }

    public function grantTeamAbilityBySlug(
        int $actorUserId,
        string $teamSlug,
        string $abilityKey,
        int $level,
        int $expireTime,
        ?Request $request = null
    ): array {
        $teamSlug = strtolower(trim($teamSlug));
        if (!preg_match('/^[a-z][a-z0-9_-]{1,49}$/D', $teamSlug)) {
            throw new HttpException(422, '请输入有效的团队 slug');
        }
        $team = Team::where('slug', $teamSlug)->field('id,slug')->find();
        if (!$team) {
            throw new HttpException(404, '团队不存在');
        }

        $ability = $this->grantTeamAbility(
            $actorUserId,
            (int) $team->id,
            $abilityKey,
            $level,
            $expireTime,
            $request
        );

        return [
            'team_slug' => (string) $team->slug,
            'ability_key' => (string) $ability['ability_key'],
            'level' => (int) $ability['level'],
            'expire_time' => (int) $ability['expire_time'],
        ];
    }

    public function moderateTeam(
        int $actorUserId,
        int $teamId,
        bool $banned,
        string $reason,
        Request $request
    ): void {
        $reason = $this->reason($reason);
        $changed = Db::transaction(function () use ($actorUserId, $teamId, $banned, $reason, $request): ?array {
            $team = Team::where('id', $teamId)->lock(true)->find();
            if (!$team) {
                throw new HttpException(404, '团队不存在');
            }
            if ((int) $team->is_banned === (int) $banned) {
                return null;
            }
            $before = (int) $team->is_banned;
            $team->is_banned = $banned ? 1 : 0;
            $team->save();
            app(BusinessAudit::class)->recordPlatform(
                $actorUserId,
                $banned ? 'team.ban' : 'team.unban',
                'team',
                $teamId,
                ['reason' => $reason, 'before' => $before, 'after' => (int) $banned],
                $request
            );

            return ['id' => (int) $team->id, 'slug' => (string) $team->slug];
        });
        if ($changed) {
            Cache::delete("team_slug_{$changed['slug']}");
            Cache::delete("team_id_{$changed['id']}");
        }
    }

    public function auditEvents(array $filters): array
    {
        [$page, $limit] = app(Pagination::class)->normalize(
            (int) ($filters['page'] ?? 1),
            (int) ($filters['limit'] ?? Pagination::DEFAULT_LIMIT)
        );
        $query = Db::name('business_audit_event')->alias('event')
            ->leftJoin('user actor', 'actor.id = event.authenticated_user_id')
            ->whereNull('event.delete_time');
        foreach (['application', 'action', 'resource_type'] as $field) {
            $value = trim((string) ($filters[$field] ?? ''));
            if ($value !== '') {
                $query->where("event.{$field}", $value);
            }
        }
        if ((int) ($filters['resource_id'] ?? 0) > 0) {
            $query->where('event.resource_id', (int) $filters['resource_id']);
        }
        if ((int) ($filters['actor_user_id'] ?? 0) > 0) {
            $query->where('event.authenticated_user_id', (int) $filters['actor_user_id']);
        }
        $paginator = $query->field([
            'event.id', 'event.team_id', 'event.entity_id', 'event.authenticated_user_id',
            'event.application', 'event.action', 'event.resource_type', 'event.resource_id',
            'event.request_id', 'event.context', 'event.create_time', 'actor.username actor_username',
        ])->order('event.id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection()->toArray();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();
        foreach ($rows as &$row) {
            if (is_string($row['context'] ?? null)) {
                $row['context'] = json_decode($row['context'], true);
            }
        }

        return ['total' => $total, 'list' => $rows, 'page' => $page, 'limit' => $limit];
    }

    public function systemHealth(): array
    {
        $checks = [];
        $checks[] = $this->check('api', 'API 服务', static fn (): bool => true);
        $checks[] = $this->check('database', '数据库', static fn (): bool =>
            (int) Db::query('SELECT 1 AS healthy')[0]['healthy'] === 1
        );
        $checks[] = $this->check('cache', '缓存', static function (): bool {
            Cache::get('admin_health_probe');
            return true;
        });
        $runtime = app()->getRuntimePath();
        $checks[] = [
            'key' => 'storage',
            'name' => '运行目录',
            'status' => is_dir($runtime) && is_writable($runtime) ? 'healthy' : 'degraded',
            'message' => is_dir($runtime) && is_writable($runtime) ? '可写' : '不可写',
        ];

        return [
            'status' => in_array('unhealthy', array_column($checks, 'status'), true) ? 'unhealthy'
                : (in_array('degraded', array_column($checks, 'status'), true) ? 'degraded' : 'healthy'),
            'checked_at' => time(),
            'checks' => $checks,
            'backlogs' => [
                'chat_outbox_pending' => $this->safeCount('chat_event_outbox', ['processed_at' => null]),
                'external_compensation_pending' => $this->safeCount('external_compensation', ['completed_at' => null]),
                'webhook_delivery_pending' => $this->safeCount('chat_webhook_delivery', ['status' => 'pending']),
            ],
        ];
    }

    private function check(string $key, string $name, callable $callback): array
    {
        try {
            $healthy = $callback();
            return ['key' => $key, 'name' => $name, 'status' => $healthy ? 'healthy' : 'degraded', 'message' => $healthy ? '正常' : '需要检查'];
        } catch (\Throwable) {
            return ['key' => $key, 'name' => $name, 'status' => 'unhealthy', 'message' => '检查失败'];
        }
    }

    private function safeCount(string $table, array $conditions): int
    {
        try {
            $query = Db::name($table);
            foreach ($conditions as $field => $value) {
                $value === null ? $query->whereNull($field) : $query->where($field, $value);
            }
            return $query->whereNull('delete_time')->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function reason(string $reason): string
    {
        $reason = trim($reason);
        if (mb_strlen($reason) < 5 || mb_strlen($reason) > 500) {
            throw new HttpException(422, '操作原因需填写 5–500 个字符');
        }
        return $reason;
    }

    private function isSuperAdmin(int $userId): bool
    {
        return Db::name('platform_admin_user_role')
            ->alias('binding')
            ->join('platform_admin_role role', 'role.id = binding.role_id')
            ->where('binding.user_id', $userId)
            ->where('role.role_key', PlatformAdminAccess::SUPER_ADMIN)
            ->whereNull('binding.delete_time')
            ->whereNull('role.delete_time')
            ->count() > 0;
    }

    private function maskPhone(string $phone): string
    {
        return mb_strlen($phone) >= 7 ? mb_substr($phone, 0, 3) . '****' . mb_substr($phone, -4) : $phone;
    }

    private function maskEmail(string $email): string
    {
        if (!str_contains($email, '@')) {
            return $email;
        }
        [$name, $domain] = explode('@', $email, 2);
        return mb_substr($name, 0, 1) . '***@' . $domain;
    }
}
