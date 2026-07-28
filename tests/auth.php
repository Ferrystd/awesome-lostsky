<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\AppResolver;
use app\middleware\Context;
use app\middleware\EntityRequired;
use app\middleware\JwtAuth;
use app\middleware\MemberAccess;
use app\middleware\Permission;
use app\model\Team;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\User;
use app\model\UserDevice;
use app\model\UserRefreshToken;
use app\service\Jwt;
use app\service\RefreshToken;
use Firebase\JWT\JWT as FirebaseJwt;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertThrows = static function (callable $callback, string $class, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected {$class}";
    } catch (Throwable $exception) {
        if (!$exception instanceof $class) {
            $failures[] = "{$case}: expected {$class}, got " . $exception::class;
        }
    }
};

$jwtConfig = config('jwt');
$jwtConfig['secret'] = str_repeat('a', 64);
app()->config->set($jwtConfig, 'jwt');

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $user = new User;
    $user->save([
        'phone' => '19' . random_int(100000000, 999999999),
        'email' => null,
        'password' => 'auth-test',
        'username' => "auth-test-{$suffix}",
    ]);

    $deviceToken = bin2hex(random_bytes(16));
    $device = new UserDevice;
    $device->save([
        'user_id' => (int) $user->id,
        'device_token' => $deviceToken,
        'device_name' => 'Auth Test',
        'ua' => 'tests/auth.php',
        'last_active_time' => time(),
    ]);

    $refreshDevice = new UserDevice;
    $refreshDevice->save([
        'user_id' => (int) $user->id,
        'device_token' => bin2hex(random_bytes(16)),
        'device_name' => 'Refresh Test',
        'ua' => 'tests/auth.php',
        'last_active_time' => time(),
    ]);
    $issuedRefresh = app(RefreshToken::class)->issue($refreshDevice);
    $rotated = app(RefreshToken::class)->rotate((string) $issuedRefresh['plain']);
    $storedOriginal = UserRefreshToken::find((int) $issuedRefresh['model']->id);
    $storedReplacement = UserRefreshToken::find((int) $storedOriginal->replacement_id);
    $assert(
        strlen((string) $issuedRefresh['plain']) === 64
            && !hash_equals((string) $issuedRefresh['plain'], (string) $storedOriginal->token_hash)
            && hash_equals(hash('sha256', (string) $issuedRefresh['plain']), (string) $storedOriginal->token_hash)
            && (int) $storedOriginal->used_at > 0
            && hash_equals(hash('sha256', (string) $rotated['refresh_token']), (string) $storedReplacement->token_hash),
        'refresh tokens are opaque, stored only as hashes, and rotated once'
    );
    $assertThrows(
        fn () => app(RefreshToken::class)->rotate((string) $issuedRefresh['plain']),
        HttpException::class,
        'concurrent reuse of a just-rotated refresh token is rejected without revoking the device'
    );
    $assert(
        (bool) UserDevice::find((int) $refreshDevice->id),
        'rotation grace rejection keeps the device active'
    );
    $storedOriginal->used_at = time() - 20;
    $storedOriginal->save();
    $assertThrows(
        fn () => app(RefreshToken::class)->rotate((string) $issuedRefresh['plain']),
        HttpException::class,
        'refresh token replay outside the grace period is rejected'
    );
    $assert(
        !UserDevice::find((int) $refreshDevice->id)
            && UserRefreshToken::where('family_id', $storedOriginal->family_id)
                ->whereNull('revoked_at')
                ->count() === 0,
        'refresh token replay revokes the entire family and device'
    );

    $created = app(\app\service\Team::class)->create(
        (int) $user->id,
        "auth-test-{$suffix}",
        'Auth Test'
    );
    $team = Team::find((int) $created['id']);
    $member = TeamMember::where('team_id', $team->id)
        ->where('user_id', $user->id)
        ->find();
    $assert((bool) $member, 'team creation creates the owner member');
    $ownerRole = TeamRole::where('team_id', $team->id)->where('role_key', 'owner')->find();
    $ownerPermissions = $ownerRole
        ? TeamRolePermission::where('team_id', $team->id)->where('role_id', $ownerRole->id)->column('permission_key')
        : [];
    $catalogKeys = [];
    foreach (app(\app\service\RolePermission::class)->catalog((int) $team->id)['groups'] as $group) {
        foreach ($group['items'] as $item) {
            $catalogKeys[] = $item['key'];
        }
    }
    $migratedPermissions = [
        'team.join_field.read',
        'team.join_field.write',
        'team.join_review.read',
        'team.join_review.write',
    ];
    $assert(
        !array_diff($migratedPermissions, $catalogKeys),
        'former owner-only team operations are present in the permission catalog'
    );
    sort($ownerPermissions);
    sort($catalogKeys);
    $assert(
        $ownerRole
            && $ownerPermissions === $catalogKeys
            && TeamEntityRole::where('team_id', $team->id)
                ->where('entity_id', \app\model\Entity::where('entityable_type', 'teamMember')
                    ->where('entityable_id', $member->id)->value('id'))
                ->where('role_id', $ownerRole->id)
                ->find(),
        'team creation grants the owner entity every catalog permission'
    );
    $assertThrows(
        fn () => app(\app\service\RolePermission::class)->save(
            (int) $team->id,
            (int) $ownerRole->id,
            ['not.in.catalog']
        ),
        HttpException::class,
        'permissions outside the catalog are rejected'
    );

    $token = app(Jwt::class)->createToken((int) $user->id, $deviceToken);
    $request = (new Request)->withHeader(['Authorization' => "Bearer {$token}"]);
    app(JwtAuth::class)->handle($request, static fn (Request $request) => 'jwt');
    $request->team = $team;
    $request->team_id = (int) $team->id;
    $request->slug = (string) $team->slug;
    app(Context::class)->handle($request, static fn (Request $request) => 'context');

    $assert(
        (int) $request->authenticated_user_id === (int) $user->id
            && !is_array($request->acting_entity ?? null),
        'base login keeps the user ID without silently receiving a member entity'
    );
    $assertThrows(
        fn () => app(EntityRequired::class)->handle($request, static fn (Request $request) => 'member'),
        \app\exception\EntityContextException::class,
        'business middleware rejects a missing entity'
    );
    $assertThrows(
        fn () => app(Permission::class)->handle(
            $request,
            static fn (Request $request) => 'permission',
            'team.role.read'
        ),
        \app\exception\EntityContextException::class,
        'a base JWT does not inherit the real user member roles'
    );

    $switched = app(\app\service\IdentitySession::class)->receiveMember(
        (int) $user->id,
        $deviceToken,
        (string) $team->slug
    );
    $reused = app(\app\service\IdentitySession::class)->receiveMember(
        (int) $user->id,
        $deviceToken,
        strtoupper((string) $team->slug)
    );
    $decoded = app(Jwt::class)->parseToken((string) $switched['token']);
    $resetDecoded = app(Jwt::class)->parseToken((string) $reused['token']);
    $assert(
        (int) $decoded->uid === (int) $user->id
            && (string) $decoded->act->type === 'teamMember'
            && (int) $decoded->act->id === (int) $member->id
            && (string) $switched['token'] !== (string) $reused['token'],
        'Account member receipt resolves the team slug and creates a fresh root session'
    );
    $assertThrows(
        fn () => app(\app\service\IdentitySession::class)->session(
            (int) $user->id,
            $deviceToken,
            (string) $decoded->jti,
            (string) $decoded->act->type,
            (int) $decoded->act->id
        ),
        HttpException::class,
        'resetting to a member supersedes the previous entity JWT'
    );
    $assertThrows(
        fn () => app(\app\service\IdentitySession::class)->receiveMember(
            (int) $user->id,
            $deviceToken,
            "missing-{$suffix}"
        ),
        HttpException::class,
        'Account member receipt rejects an invalid team slug without changing the active identity'
    );
    $member->is_blocked = 1;
    $member->save();
    $assertThrows(
        fn () => app(\app\service\IdentitySession::class)->receiveMember(
            (int) $user->id,
            $deviceToken,
            (string) $team->slug
        ),
        HttpException::class,
        'Account member receipt rejects a blocked member'
    );
    $member->is_blocked = 0;
    $member->save();

    $otherUser = new User;
    $otherUser->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'email' => null,
        'password' => 'auth-test',
        'username' => "auth-other-{$suffix}",
    ]);
    $otherTeamData = app(\app\service\Team::class)->create(
        (int) $otherUser->id,
        "auth-other-{$suffix}",
        'Other Team'
    );
    $otherTeam = Team::find((int) $otherTeamData['id']);
    $assertThrows(
        fn () => app(\app\service\IdentitySession::class)->receiveMember(
            (int) $user->id,
            $deviceToken,
            (string) $otherTeam->slug
        ),
        HttpException::class,
        'Account member receipt rejects a user who is not a team member'
    );

    $secondTeamData = app(\app\service\Team::class)->create(
        (int) $user->id,
        "auth-second-{$suffix}",
        'Second Team'
    );
    $secondTeam = Team::find((int) $secondTeamData['id']);
    app(\app\service\IdentitySession::class)->receiveMember(
        (int) $user->id,
        $deviceToken,
        (string) $secondTeam->slug
    );
    $assertThrows(
        fn () => app(\app\service\IdentitySession::class)->session(
            (int) $user->id,
            $deviceToken,
            (string) $resetDecoded->jti,
            (string) $resetDecoded->act->type,
            (int) $resetDecoded->act->id
        ),
        HttpException::class,
        'receiving a member in another team revokes the previous entity JWT'
    );

    $commonRequest = (new Request)
        ->setHost((string) config('app.domain.api'))
        ->withHeader([
            'Origin' => "https://{$team->slug}.team." . config('app.domain.root'),
            'X-LostSky-App' => 'common',
        ]);
    app(AppResolver::class)->handle($commonRequest, static fn (Request $request) => 'common');
    $assert(
        app('http')->getName() === 'common'
            && (int) ($commonRequest->team_id ?? 0) === (int) $team->id,
        'common app is explicitly selected while team context still comes from the origin'
    );
    $assertThrows(
        fn () => app(AppResolver::class)->handle(
            (new Request)
                ->setHost((string) config('app.domain.api'))
                ->withHeader(['X-LostSky-App' => 'shop']),
            static fn (Request $request) => 'invalid'
        ),
        HttpException::class,
        'only common may be explicitly selected'
    );
    $assertThrows(
        fn () => app(AppResolver::class)->handle(
            (new Request)
                ->setHost((string) config('app.domain.api'))
                ->withHeader([
                    'Origin' => "https://{$team->slug}.common." . config('app.domain.root'),
                ]),
            static fn (Request $request) => 'implicit-common'
        ),
        HttpException::class,
        'common cannot be selected implicitly from the origin'
    );
    $assertThrows(
        fn () => app(AppResolver::class)->handle(
            (new Request)->setHost(
                "{$team->slug}.common.api." . config('app.domain.root')
            ),
            static fn (Request $request) => 'implicit-common-host'
        ),
        HttpException::class,
        'common cannot be selected implicitly from the host'
    );
    $assert(
        in_array('common', config('app.deny_app_list'), true)
            && !array_key_exists('common', config('app.app_map')),
        'common cannot be selected through the URL application segment'
    );

    $entityRequest = new Request;
    $entityRequest->member = $member;
    $entityRequest->member_id = (int) $member->id;
    $entityRequest->acting_entity = ['type' => 'teamCustomer', 'id' => 999];
    $assertThrows(
        fn () => app(MemberAccess::class)->handle(
            $entityRequest,
            static fn (Request $request) => 'member'
        ),
        HttpException::class,
        'a non-member acting entity must explicitly switch before member-only operations'
    );

    $invalidDeviceToken = FirebaseJwt::encode([
        'iss' => config('jwt.iss'),
        'iat' => time(),
        'exp' => time() + 300,
        'uid' => (int) $user->id,
    ], $jwtConfig['secret'], 'HS256');
    $assertThrows(
        fn () => app(JwtAuth::class)->handle(
            (new Request)->withHeader(['Authorization' => "Bearer {$invalidDeviceToken}"]),
            static fn (Request $request) => 'invalid'
        ),
        HttpException::class,
        'JWT without a device claim is rejected'
    );

    $invalidIssuerToken = FirebaseJwt::encode([
        'iss' => 'wrong-issuer',
        'iat' => time(),
        'exp' => time() + 300,
        'uid' => (int) $user->id,
        'dvt' => $deviceToken,
    ], $jwtConfig['secret'], 'HS256');
    $assertThrows(
        fn () => app(JwtAuth::class)->handle(
            (new Request)->withHeader(['Authorization' => "Bearer {$invalidIssuerToken}"]),
            static fn (Request $request) => 'invalid'
        ),
        HttpException::class,
        'JWT with the wrong issuer is rejected'
    );

    $assertThrows(
        fn () => app(RefreshToken::class)->rotate($token),
        HttpException::class,
        'an access JWT cannot be used as a refresh token'
    );

    $unsafeConfig = $jwtConfig;
    $unsafeConfig['secret'] = 'lostsky_jwt_secret_default_change_in_production';
    app()->config->set($unsafeConfig, 'jwt');
    $assertThrows(
        fn () => app(Jwt::class)->createToken((int) $user->id, $deviceToken),
        RuntimeException::class,
        'known fallback JWT secret is rejected'
    );
    app()->config->set($jwtConfig, 'jwt');
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Auth tests passed." . PHP_EOL);
