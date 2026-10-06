<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\middleware\JwtAuth;
use app\model\BusinessAuditEvent;
use app\model\PlatformAdminRole;
use app\model\PlatformAdminUserRole;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamAbilityGrant;
use app\model\TeamMember;
use app\model\User;
use app\model\UserDevice;
use app\model\UserRefreshToken;
use app\service\Jwt;
use app\service\Login;
use app\service\PermissionDictionary;
use app\service\PlatformAdmin;
use app\service\PlatformAdminAccess;
use app\service\RefreshToken;
use think\App;
use think\exception\HttpException;
use think\facade\Cache;
use think\Request;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertThrows = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HTTP {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: expected HTTP {$status}, got {$exception->getStatusCode()}";
        }
    }
};
$root = dirname(__DIR__);
$schema = (string) file_get_contents("{$root}/sql/schema.sql");
$patch = (string) file_get_contents("{$root}/sql/patches/20260729_admin_platform.sql");
$adminRoutes = (string) file_get_contents("{$root}/app/admin/route/app.php");
$teamController = (string) file_get_contents("{$root}/app/admin/controller/Teams.php");
foreach ([
    '`is_banned`' => 'user ban flag is declared',
    'CREATE TABLE `platform_admin_role`' => 'platform role table is declared',
    'CREATE TABLE `platform_admin_role_permission`' => 'platform permission table is declared',
    'CREATE TABLE `platform_admin_user_role`' => 'platform user role table is declared',
    'fk_platform_admin_assigner' => 'administrator grantor foreign key is declared',
] as $needle => $case) {
    $assert(str_contains($schema, $needle) && str_contains($patch, $needle), $case);
}
$assert(
    preg_match('/`entity_id`\s+INT UNSIGNED NULL/', $schema) === 1
        && preg_match('/`entity_id`\s+INT UNSIGNED NULL/', $patch) === 1,
    'audit entity is nullable for platform events'
);
$assert(
    preg_match('/`authenticated_user_id`\s+INT UNSIGNED NULL/', $schema) === 1
        && preg_match('/`authenticated_user_id`\s+INT UNSIGNED NULL/', $patch) === 1,
    'audit user is nullable for CLI events'
);
$assert(
    PermissionDictionary::adminKeys() === [
        'admin.dashboard.read',
        'admin.system.read',
        'admin.user.read',
        'admin.user.sensitive.read',
        'admin.user.moderate',
        'admin.user.session.revoke',
        'admin.team.read',
        'admin.team.moderate',
        'admin.team.ability.write',
        'admin.access.read',
        'admin.access.write',
        'admin.audit.read',
        'admin.site.read',
        'admin.site.write',
        'admin.entitlement.read',
        'admin.entitlement.write',
    ],
    'platform permission catalog matches the public contract'
);
$assert(
    str_contains($adminRoutes, "Route::get('team-abilities/catalog', 'teams/abilityCatalog')")
        && str_contains($adminRoutes, "Route::post('team-abilities', 'teams/grantAbility')")
        && !str_contains($adminRoutes, "teams/<id>/abilities"),
    'Team Ability HTTP routes use the exact-slug contract instead of a readable Team id'
);
$assert(
    str_contains(
        $teamController,
        "Permissions::ADMIN_TEAM_ABILITY_WRITE => ['only' => ['abilityCatalog', 'grantAbility']]"
    )
        && str_contains($teamController, 'use app\\service\\AbilityCatalog;')
        && str_contains($teamController, "post('team_slug/s', '')"),
    'Team Ability catalog and grant use the real catalog service with only their dedicated write permission and slug input'
);
if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

$adminTables = \think\facade\Db::query("SHOW TABLES LIKE 'platform_admin_role'");
$userColumns = array_column(\think\facade\Db::query('SHOW COLUMNS FROM `user`'), 'Field');
if (!$adminTables || !in_array('is_banned', $userColumns, true)) {
    fwrite(STDOUT, "Admin static contracts passed; database integration skipped until 20260729_admin_platform.sql is applied\n");
    exit(0);
}

$newUser = static function (string $name): User {
    $user = new User;
    $user->save([
        'phone' => '17' . random_int(100000000, 999999999),
        'email' => "{$name}@example.test",
        'password' => password_hash('admin-test-password', PASSWORD_DEFAULT),
        'username' => $name,
        'is_banned' => 0,
    ]);
    return $user;
};
$newDevice = static function (User $user, string $name): UserDevice {
    $device = new UserDevice;
    $device->save([
        'user_id' => (int) $user->id,
        'device_token' => bin2hex(random_bytes(16)),
        'device_name' => $name,
        'ua' => 'tests/admin.php',
        'last_active_time' => time(),
    ]);
    return $device;
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $actor = $newUser("admin-actor-{$suffix}");
    $spare = $newUser("admin-spare-{$suffix}");
    $target = $newUser("admin-target-{$suffix}");
    $outsider = $newUser("admin-outsider-{$suffix}");
    $access = app(PlatformAdminAccess::class);
    $admin = app(PlatformAdmin::class);
    foreach (['fk_platform_permission_role', 'fk_platform_admin_user', 'fk_platform_admin_role', 'fk_platform_admin_assigner'] as $constraint) {
        $exists = \think\facade\Db::query(
            'SELECT COUNT(*) AS total FROM information_schema.referential_constraints '
            . 'WHERE constraint_schema = DATABASE() AND constraint_name = :name',
            ['name' => $constraint]
        )[0];
        $assert((int) $exists['total'] === 1, "{$constraint} is installed");
    }
    $access->bootstrapSuperRole();
    $superRole = PlatformAdminRole::where('role_key', PlatformAdminAccess::SUPER_ADMIN)->find();
    foreach (PlatformAdminUserRole::where('role_id', $superRole->id)->select() as $existingSuperBinding) {
        $existingSuperBinding->delete();
    }
    foreach ([$actor, $spare] as $superUser) {
        (new PlatformAdminUserRole)->save([
            'user_id' => (int) $superUser->id,
            'role_id' => (int) $superRole->id,
            'assigned_by_user_id' => null,
        ]);
    }

    $roleRequest = new Request;
    $roleRequest->request_id = "admin-role-create-{$suffix}";
    $readRoleId = $access->createRole([
        'role_key' => "reader_{$suffix}",
        'name' => '平台只读',
        'description' => '测试权限并集',
        'permission_keys' => [PermissionDictionary::ADMIN_USER_READ],
    ], (int) $actor->id, $roleRequest);
    $teamRoleId = $access->createRole([
        'role_key' => "team_reader_{$suffix}",
        'name' => '团队只读',
        'description' => '测试权限并集',
    ], (int) $actor->id);
    $access->savePermissions($teamRoleId, [PermissionDictionary::ADMIN_TEAM_READ], (int) $actor->id);
    $roleCreateEvent = BusinessAuditEvent::where('application', 'admin')
        ->where('action', 'role.create')
        ->where('resource_id', $readRoleId)
        ->order('id', 'desc')
        ->find();
    $assert(
        app(PlatformAdminAccess::class)->role($readRoleId)['permissions']
            === [PermissionDictionary::ADMIN_USER_READ],
        'role creation saves its permissions in the same service transaction'
    );
    $assert(
        $roleCreateEvent
            && ($roleCreateEvent->context['source'] ?? null) === 'api'
            && $roleCreateEvent->request_id === $roleRequest->request_id,
        'API role changes preserve their source and request ID'
    );
    foreach ([$readRoleId, $teamRoleId] as $roleId) {
        (new PlatformAdminUserRole)->save([
            'user_id' => (int) $target->id,
            'role_id' => $roleId,
            'assigned_by_user_id' => (int) $actor->id,
        ]);
    }
    $assert(
        $access->has((int) $target->id, PermissionDictionary::ADMIN_USER_READ)
            && $access->has((int) $target->id, PermissionDictionary::ADMIN_TEAM_READ),
        'multiple platform roles produce a permission union'
    );
    $assert(
        !array_diff(PermissionDictionary::adminKeys(), $access->session((int) $actor->id)['permissions']),
        'super administrator receives every platform permission'
    );
    $assertThrows(
        fn () => $access->assertAdmin((int) $outsider->id),
        403,
        'a user without platform roles is rejected'
    );
    $assertThrows(
        fn () => $access->assignRoles((int) $actor->id, (int) $actor->id, [$readRoleId]),
        409,
        'an administrator cannot change their own roles'
    );
    $assertThrows(
        fn () => $access->deleteRole($readRoleId, (int) $actor->id),
        409,
        'a role with administrator bindings cannot be deleted'
    );

    $spareBinding = PlatformAdminUserRole::where('user_id', $spare->id)
        ->where('role_id', $superRole->id)->find();
    $spareBinding->delete();
    $assertThrows(
        fn () => $access->assertAnotherActiveSuperAdmin((int) $actor->id),
        409,
        'the last active super administrator is protected'
    );

    foreach (['a', 'b'] as $index) {
        $countTeam = new Team;
        $countTeam->save([
            'slug' => "admin-count-{$index}-{$suffix}",
            'user_id' => (int) $outsider->id,
            'is_banned' => 0,
            'is_cancelled' => 0,
        ]);
        (new TeamMember)->save([
            'team_id' => (int) $countTeam->id,
            'user_id' => (int) $target->id,
            'status' => TeamMemberStatus::Active,
        ]);
    }
    $newDevice($target, 'Count Device A');
    $newDevice($target, 'Count Device B');
    $countPage = $admin->users([
        'q' => (string) $target->username,
        'page' => 1,
        'limit' => 1,
    ]);
    $countRow = $countPage['list'][0] ?? [];
    $assert(
        $countPage['total'] === 1
            && $countPage['page'] === 1
            && $countPage['limit'] === 1
            && ($countRow['team_count'] ?? null) === 2
            && ($countRow['device_count'] ?? null) === 2
            && !array_key_exists('profile', $countRow),
        'user listing uses relation counts without exposing the profile relation'
    );

    $masked = $admin->user((int) $target->id);
    $sensitive = $admin->user((int) $target->id, true);
    $assert(
        !array_key_exists('phone', $masked)
            && !array_key_exists('email', $masked)
            && str_contains((string) $masked['phone_masked'], '****')
            && $sensitive['phone'] === $target->phone
            && $sensitive['email'] === $target->email,
        'user responses always include masked contacts and gate full contacts'
    );
    $maskedSearch = $admin->users(['q' => (string) $target->phone], false);
    $sensitiveSearch = $admin->users(['q' => (string) $target->phone], true);
    $restrictedGlobalSearch = $admin->search((string) $target->phone, (int) $target->id);
    $assert(
        $maskedSearch['total'] === 0
            && $sensitiveSearch['total'] === 1
            && $restrictedGlobalSearch['users'] === [],
        'phone and email search require the sensitive user permission'
    );

    $device = $newDevice($target, 'Governance Device');
    $issued = app(RefreshToken::class)->issue($device);
    $request = new Request;
    $request->request_id = "admin-ban-{$suffix}";
    $admin->moderateUser(
        (int) $actor->id,
        (int) $target->id,
        true,
        '测试封禁并撤销全部现有会话',
        $request
    );
    $assert(
        (int) User::find($target->id)->is_banned === 1
            && !UserDevice::find($device->id)
            && UserRefreshToken::where('user_id', $target->id)->whereNull('revoked_at')->count() === 0,
        'banning a user revokes devices and refresh tokens'
    );
    $assertThrows(
        fn () => app(Login::class)->byAccount((string) $target->username, 'admin-test-password'),
        403,
        'password login rejects a banned user'
    );
    $bannedDevice = $newDevice($target, 'Banned Probe');
    $bannedRefresh = app(RefreshToken::class)->issue($bannedDevice);
    $assertThrows(
        fn () => app(RefreshToken::class)->rotate((string) $bannedRefresh['plain']),
        403,
        'refresh token rotation rejects a banned user'
    );
    $jwtConfig = config('jwt');
    $jwtConfig['secret'] = str_repeat('b', 64);
    app()->config->set($jwtConfig, 'jwt');
    $token = app(Jwt::class)->createToken((int) $target->id, (string) $bannedDevice->device_token);
    $assertThrows(
        fn () => app(JwtAuth::class)->handle(
            (new Request)->withHeader(['Authorization' => "Bearer {$token}"]),
            static fn (Request $request) => $request
        ),
        403,
        'JWT middleware rejects a banned user'
    );
    $admin->moderateUser(
        (int) $actor->id,
        (int) $target->id,
        false,
        '测试解封且不恢复任何历史会话',
        new Request
    );
    $assert(
        (int) User::find($target->id)->is_banned === 0 && !UserDevice::find($device->id),
        'unbanning a user does not restore old sessions'
    );

    $teamDevice = $newDevice($outsider, 'Unaffected Device');
    $team = new Team;
    $team->save([
        'slug' => "admin-team-{$suffix}",
        'user_id' => (int) $outsider->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    Cache::set("team_slug_{$team->slug}", ['stale' => true], 3600);
    Cache::set("team_id_{$team->id}", ['stale' => true], 3600);
    $admin->moderateTeam(
        (int) $actor->id,
        (int) $team->id,
        true,
        '测试团队封禁不影响用户其他会话',
        new Request
    );
    $auditCount = BusinessAuditEvent::where('application', 'admin')
        ->where('action', 'team.ban')->where('resource_id', $team->id)->count();
    $admin->moderateTeam(
        (int) $actor->id,
        (int) $team->id,
        true,
        '重复提交保持团队封禁结果不变',
        new Request
    );
    $assert(
        (int) Team::find($team->id)->is_banned === 1
            && (bool) UserDevice::find($teamDevice->id)
            && Cache::get("team_slug_{$team->slug}") === null
            && Cache::get("team_id_{$team->id}") === null
            && BusinessAuditEvent::where('application', 'admin')
                ->where('action', 'team.ban')->where('resource_id', $team->id)->count() === $auditCount,
        'team moderation is idempotent and does not revoke user sessions'
    );
    $assertThrows(
        fn () => $admin->moderateTeam(
            (int) $actor->id,
            (int) $team->id,
            false,
            '短',
            new Request
        ),
        422,
        'moderation reasons must contain 5 to 500 characters'
    );

    $abilityRequest = new Request;
    $abilityRequest->request_id = "admin-ability-{$suffix}";
    $expireTime = time() + 3600;
    $grantedBySlug = $admin->grantTeamAbilityBySlug(
        (int) $actor->id,
        (string) $team->slug,
        'file',
        2,
        $expireTime,
        $abilityRequest
    );
    $granted = TeamAbility::where('team_id', $team->id)->where('ability_key', 'file')->find()->toArray();
    $abilityAudit = BusinessAuditEvent::where('application', 'admin')
        ->where('action', 'ability.grant')
        ->where('resource_type', 'team_ability')
        ->where('resource_id', $granted['id'])
        ->order('id', 'desc')
        ->find();
    $assert(
        $grantedBySlug === [
            'team_slug' => (string) $team->slug,
            'ability_key' => 'file',
            'level' => 2,
            'expire_time' => $expireTime,
        ]
            && TeamAbilityGrant::where('team_id', $team->id)
                ->where('ability_key', 'file')->where('source_type', 'manual')
                ->whereNull('revoked_at')->count() === 1
            && $abilityAudit
            && $abilityAudit->authenticated_user_id === (int) $actor->id
            && $abilityAudit->request_id === $abilityRequest->request_id,
        'write-only platform administrator grants a catalog Ability by exact slug with a minimal response'
    );
    $assertThrows(
        fn () => $admin->grantTeamAbilityBySlug((int) $actor->id, 'INVALID SLUG', 'file', 1, 0),
        422,
        'slug grants reject invalid Team slugs before lookup'
    );
    $assertThrows(
        fn () => $admin->grantTeamAbilityBySlug((int) $actor->id, 'missing-team', 'file', 1, 0),
        404,
        'slug grants do not expose a Team directory when the exact Team is absent'
    );
    $admin->grantTeamAbility((int) $actor->id, (int) $team->id, 'file', 3, 0);
    $assert(
        TeamAbilityGrant::where('team_id', $team->id)
            ->where('ability_key', 'file')->where('source_type', 'manual')
            ->whereNull('revoked_at')->count() === 1
            && (int) TeamAbility::where('team_id', $team->id)
                ->where('ability_key', 'file')->value('level') === 3,
        'repeated direct grants replace the previous manual grant and refresh the projection'
    );
    $assertThrows(
        fn () => $admin->grantTeamAbility((int) $actor->id, (int) $team->id, 'unknown', 1, 0),
        422,
        'direct grants only accept the fixed Ability catalog'
    );

    $access->grantByKey((int) $outsider->id, "reader_{$suffix}");
    $cliEvent = BusinessAuditEvent::where('application', 'admin')
        ->where('action', 'administrator.role.grant')
        ->where('resource_id', $outsider->id)
        ->order('id', 'desc')
        ->find();
    $assert(
        $cliEvent
            && $cliEvent->authenticated_user_id === null
            && $cliEvent->entity_id === null
            && ($cliEvent->context['source'] ?? null) === 'cli',
        'CLI bootstrap changes are audited without an entity or authenticated user'
    );
    $health = $admin->systemHealth();
    $databasePassword = (string) config('database.connections.mysql.password');
    $assert(
        isset($health['status'], $health['checked_at'], $health['checks'], $health['backlogs'])
            && ($databasePassword === ''
                || !str_contains(json_encode($health, JSON_UNESCAPED_UNICODE), $databasePassword)),
        'system health returns a stable, secret-free response'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Admin integration tests passed\n");
