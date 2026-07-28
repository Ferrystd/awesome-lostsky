<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
use app\model\User;
use app\model\UserDevice;
use app\service\EntityRole;
use app\service\IdentitySession;
use app\service\Jwt;
use app\service\RolePermission;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertThrows = static function (callable $callback, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HttpException";
    } catch (HttpException) {
    } catch (Throwable $exception) {
        $failures[] = "{$case}: expected HttpException, got " . $exception::class;
    }
};

$jwtConfig = config('jwt');
$jwtConfig['secret'] = str_repeat('d', 64);
app()->config->set($jwtConfig, 'jwt');

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $user = new User;
    $user->save([
        'phone' => '17' . random_int(100000000, 999999999),
        'password' => 'delegation-test',
        'username' => "delegator-{$suffix}",
    ]);
    $otherUser = new User;
    $otherUser->save([
        'phone' => '16' . random_int(100000000, 999999999),
        'password' => 'delegation-test',
        'username' => "target-owner-{$suffix}",
    ]);
    $deviceToken = bin2hex(random_bytes(16));
    $device = new UserDevice;
    $device->save([
        'user_id' => (int) $user->id,
        'device_token' => $deviceToken,
        'device_name' => 'Delegation Test',
        'ua' => 'tests/identity_delegation.php',
        'last_active_time' => time(),
    ]);

    $teamAData = app(\app\service\Team::class)->create(
        (int) $user->id,
        "delegate-a-{$suffix}",
        'Delegation A'
    );
    $teamBData = app(\app\service\Team::class)->create(
        (int) $otherUser->id,
        "delegate-b-{$suffix}",
        'Delegation B'
    );
    $teamA = Team::find((int) $teamAData['id']);
    $teamB = Team::find((int) $teamBData['id']);
    $memberA = TeamMember::where('team_id', $teamA->id)->where('user_id', $user->id)->with(['identity'])->find();
    $memberB = TeamMember::where('team_id', $teamB->id)->where('user_id', $otherUser->id)->with(['identity'])->find();

    $customerB = new TeamCustomer;
    $customerB->save([
        'team_id' => (int) $teamB->id,
        'user_id' => (int) $user->id,
        'is_blocked' => 0,
    ]);
    $customerIdentity = app(\app\service\Entity::class)->claimCustomer(
        (int) $customerB->id,
        "customer-{$customerB->id}-{$suffix}"
    );

    $virtualB = new TeamVirtual;
    $virtualB->save([
        'team_id' => (int) $teamB->id,
        'name' => 'Target Bot',
        'is_active' => 1,
    ]);
    $virtualBIdentity = app(\app\service\Entity::class)->claimVirtual(
        $virtualB,
        "target-bot-{$suffix}"
    );

    $identity = app(IdentitySession::class);
    $rootCandidates = $identity->candidates((int) $user->id);
    $rootSlugs = array_column($rootCandidates, 'slug');
    $assert(
        in_array((string) $memberA->slug, $rootSlugs, true)
            && in_array((string) $customerIdentity->slug, $rootSlugs, true),
        'a base user can discover its own valid member and customer roots'
    );
    $memberRoot = $identity->receive(
        (int) $user->id,
        $deviceToken,
        (string) $memberA->slug
    );
    $customerRoot = $identity->receive(
        (int) $user->id,
        $deviceToken,
        (string) $customerIdentity->slug
    );
    $assert(
        ($memberRoot['identity']['type'] ?? null) === 'teamMember'
            && ($customerRoot['identity']['type'] ?? null) === 'teamCustomer',
        'a base user can directly receive its own member and customer roots'
    );

    $roleB = new TeamRole;
    $roleB->save([
        'team_id' => (int) $teamB->id,
        'role_key' => "delegator-{$suffix}",
        'name' => 'External delegator',
        'description' => '',
        'sort' => 10,
    ]);
    $ungrantedRoot = $identity->receive((int) $user->id, $deviceToken, (string) $memberA->slug);
    $ungrantedDecoded = app(Jwt::class)->parseToken((string) $ungrantedRoot['token']);
    $ungrantedSession = $identity->session(
        (int) $user->id,
        $deviceToken,
        (string) $ungrantedDecoded->jti,
        (string) $ungrantedDecoded->act->type,
        (int) $ungrantedDecoded->act->id
    );
    $assertThrows(
        fn () => $identity->receive(
            (int) $user->id,
            $deviceToken,
            (string) $memberB->slug,
            $ungrantedSession
        ),
        'permissions held in the source team do not authorize a target in another team'
    );
    app(EntityRole::class)->save(
        (int) $teamB->id,
        (string) $memberA->slug,
        [(int) $roleB->id]
    );
    $described = app(EntityRole::class)->describe((int) $teamB->id, (string) $memberA->slug);
    $assert(
        ($described['is_external'] ?? false) === true
            && (int) ($described['team']['id'] ?? 0) === (int) $teamA->id,
        'a target team resolves and assigns roles to a non-searchable external entity by global slug'
    );
    app(RolePermission::class)->save((int) $teamB->id, (int) $roleB->id, [
        'identity.team.assume',
        "identity.member.{$memberB->slug}.assume",
        'identity.customer.*.assume',
        'identity.virtual.*.assume',
    ]);

    $root = $identity->receive((int) $user->id, $deviceToken, (string) $memberA->slug);
    $rootToken = app(Jwt::class)->parseToken((string) $root['token']);
    $rootSession = $identity->session(
        (int) $user->id,
        $deviceToken,
        (string) $rootToken->jti,
        (string) $rootToken->act->type,
        (int) $rootToken->act->id
    );
    $delegatedCandidates = $identity->candidates((int) $user->id, $rootSession);
    $delegatedSlugs = array_column($delegatedCandidates, 'slug');
    foreach ([
        (string) $teamB->slug,
        (string) $memberB->slug,
        (string) $customerIdentity->slug,
        (string) $virtualBIdentity->slug,
    ] as $slug) {
        $assert(in_array($slug, $delegatedSlugs, true), "delegated candidates include {$slug}");
    }

    foreach ([
        (string) $teamB->slug => 'team',
        (string) $memberB->slug => 'teamMember',
        (string) $customerIdentity->slug => 'teamCustomer',
        (string) $virtualBIdentity->slug => 'teamVirtual',
    ] as $slug => $type) {
        $freshRoot = $identity->receive((int) $user->id, $deviceToken, (string) $memberA->slug);
        $decodedRoot = app(Jwt::class)->parseToken((string) $freshRoot['token']);
        $current = $identity->session(
            (int) $user->id,
            $deviceToken,
            (string) $decodedRoot->jti,
            (string) $decodedRoot->act->type,
            (int) $decodedRoot->act->id
        );
        $target = $identity->receive((int) $user->id, $deviceToken, $slug, $current);
        $assert(
            ($target['identity']['type'] ?? null) === $type
                && (int) ($target['identity']['team']['id'] ?? 0) === (int) $teamB->id,
            "cross-team delegation receives {$type}"
        );
        $assertThrows(
            fn () => $identity->session(
                (int) $user->id,
                $deviceToken,
                (string) $decodedRoot->jti,
                (string) $decodedRoot->act->type,
                (int) $decodedRoot->act->id
            ),
            "the source JWT is superseded after receiving {$type}"
        );
    }

    $roleA = new TeamRole;
    $roleA->save([
        'team_id' => (int) $teamA->id,
        'role_key' => "returner-{$suffix}",
        'name' => 'Return delegator',
        'description' => '',
        'sort' => 20,
    ]);
    app(EntityRole::class)->save(
        (int) $teamA->id,
        (string) $memberB->slug,
        [(int) $roleA->id]
    );
    app(RolePermission::class)->save((int) $teamA->id, (int) $roleA->id, [
        "identity.member.{$memberA->slug}.assume",
    ]);

    $loopRoot = $identity->receive((int) $user->id, $deviceToken, (string) $memberA->slug);
    $loopRootDecoded = app(Jwt::class)->parseToken((string) $loopRoot['token']);
    $loopRootSession = $identity->session(
        (int) $user->id,
        $deviceToken,
        (string) $loopRootDecoded->jti,
        (string) $loopRootDecoded->act->type,
        (int) $loopRootDecoded->act->id
    );
    $loopB = $identity->receive(
        (int) $user->id,
        $deviceToken,
        (string) $memberB->slug,
        $loopRootSession
    );
    $loopBDecoded = app(Jwt::class)->parseToken((string) $loopB['token']);
    $loopBSession = $identity->session(
        (int) $user->id,
        $deviceToken,
        (string) $loopBDecoded->jti,
        (string) $loopBDecoded->act->type,
        (int) $loopBDecoded->act->id
    );
    $loopA = $identity->receive(
        (int) $user->id,
        $deviceToken,
        (string) $memberA->slug,
        $loopBSession
    );
    $loopADecoded = app(Jwt::class)->parseToken((string) $loopA['token']);
    $loopLeaf = $identity->session(
        (int) $user->id,
        $deviceToken,
        (string) $loopADecoded->jti,
        (string) $loopADecoded->act->type,
        (int) $loopADecoded->act->id
    );
    $assert(
        (int) $loopLeaf->parent_session_id === (int) $loopBSession->id
            && (int) $loopBSession->parent_session_id === (int) $loopRootSession->id
            && (int) $loopLeaf->expires_at === (int) $loopRootSession->expires_at,
        'A to B to A is represented by an acyclic session proof chain with the root expiry'
    );

    app(RolePermission::class)->save((int) $teamB->id, (int) $roleB->id, [
        'identity.team.assume',
        'identity.customer.*.assume',
        'identity.virtual.*.assume',
    ]);
    $assertThrows(
        fn () => $identity->session(
            (int) $user->id,
            $deviceToken,
            (string) $loopADecoded->jti,
            (string) $loopADecoded->act->type,
            (int) $loopADecoded->act->id
        ),
        'revoking an intermediate exact permission immediately invalidates the downstream chain'
    );

    app(RolePermission::class)->save((int) $teamB->id, (int) $roleB->id, [
        'identity.team.assume',
        "identity.member.{$memberB->slug}.assume",
        'identity.customer.*.assume',
        'identity.virtual.*.assume',
    ]);
    $binding = TeamEntityRole::where('team_id', $teamB->id)
        ->where('entity_id', $memberA->identity->id)
        ->where('role_id', $roleB->id)
        ->find();
    $binding?->delete();
    $assertThrows(
        fn () => $identity->session(
            (int) $user->id,
            $deviceToken,
            (string) $loopADecoded->jti,
            (string) $loopADecoded->act->type,
            (int) $loopADecoded->act->id
        ),
        'removing an external role binding immediately invalidates the downstream chain'
    );

    $assertThrows(
        fn () => $identity->receive(
            (int) $user->id,
            $deviceToken,
            "missing-{$suffix}"
        ),
        'an invalid global slug is rejected'
    );
    $virtualB->is_active = 0;
    $virtualB->save();
    $assertThrows(
        fn () => $identity->receive(
            (int) $user->id,
            $deviceToken,
            (string) $virtualBIdentity->slug,
            $loopRootSession
        ),
        'an inactive target entity is rejected'
    );

    $memberA->is_blocked = 1;
    $memberA->save();
    $assertThrows(
        fn () => $identity->session(
            (int) $user->id,
            $deviceToken,
            (string) $loopADecoded->jti,
            (string) $loopADecoded->act->type,
            (int) $loopADecoded->act->id
        ),
        'blocking the root identity immediately invalidates the entire downstream chain'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Identity delegation tests passed." . PHP_EOL);
