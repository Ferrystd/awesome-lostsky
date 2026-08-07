<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\EntityType;
use app\middleware\EntityRequired;
use app\middleware\TeamBelongs;
use app\exception\EntityContextException;
use think\exception\HttpException;
use think\Request;

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertSame = static function (mixed $expected, mixed $actual, string $case) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = "{$case}: expected " . json_encode($expected) . ', got ' . json_encode($actual);
    }
};
$assertThrows = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HttpException {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: expected {$status}, got {$exception->getStatusCode()}";
        }
    } catch (Throwable $exception) {
        $failures[] = "{$case}: expected HttpException {$status}, got " . $exception::class;
    }
};
$request = static function (?array $acting = null, int $teamId = 0, bool $withContext = true): Request {
    $request = new Request;
    if ($withContext) {
        $request->authenticated_user_id = 900001;
    }
    if ($acting !== null) {
        $request->acting_entity = $acting;
    }
    if ($teamId > 0) {
        $request->team_id = $teamId;
        $request->slug = "team-{$teamId}";
    }
    return $request;
};
$next = static fn (Request $request): string => 'passed';

$entityType = new EntityType;
foreach (['teamless', 'team', 'teamMember', 'teamCustomer', 'teamVirtual'] as $type) {
    $acting = $type === 'teamless' ? null : ['type' => $type, 'id' => 1];
    $assertSame(
        'passed',
        $entityType->handle($request($acting), $next, $type),
        "{$type} passes its exact EntityType declaration"
    );
}
$assertSame(
    'passed',
    $entityType->handle(
        $request(['type' => 'teamMember', 'id' => 1]),
        $next,
        'team,teamMember'
    ),
    'comma-separated EntityType arguments form an OR set'
);
$assertSame(
    'passed',
    $entityType->handle(
        $request(['type' => 'teamCustomer', 'id' => 1]),
        $next,
        'team',
        'teamCustomer'
    ),
    'array-style EntityType arguments form an OR set'
);
$assertThrows(
    fn () => $entityType->handle($request(), $next),
    500,
    'EntityType requires at least one argument'
);
$assertThrows(
    fn () => $entityType->handle($request(), $next, 'team,,teamMember'),
    500,
    'EntityType rejects an empty argument'
);
$assertThrows(
    fn () => $entityType->handle($request(), $next, 'teamVitural'),
    500,
    'EntityType rejects misspelled canonical types'
);
$assertThrows(
    fn () => $entityType->handle($request(null, 0, false), $next, 'teamless'),
    500,
    'EntityType requires Context to run first'
);
$assertThrows(
    fn () => $entityType->handle(
        $request(['type' => 'teamMember', 'id' => 1]),
        $next,
        'teamCustomer'
    ),
    403,
    'EntityType rejects a disallowed runtime identity'
);

$teamBelongs = new TeamBelongs;
$entityRequired = new EntityRequired;
$assertSame(
    'passed',
    $entityRequired->handle($request(['type' => 'team', 'id' => 11], 10), $next),
    'EntityRequired allows an entity from another team when no belonging check is declared'
);
$assertThrows(
    fn () => $entityRequired->handle($request(null, 10), $next),
    428,
    'EntityRequired rejects a base user without silently receiving a member'
);
try {
    $entityRequired->handle($request(null, 10), $next);
    $failures[] = 'missing entity error exposes the unified contract';
} catch (EntityContextException $exception) {
    $assertSame(42801, $exception->getCode(), 'missing entity uses code 42801');
    $assertSame('team-10', $exception->data()['team_slug'] ?? null, 'missing entity includes current team slug');
}
$assertSame(
    'passed',
    $teamBelongs->handle($request(['type' => 'team', 'id' => 10], 10), $next),
    'team entity belongs when its ID matches the current team'
);
$assertThrows(
    fn () => $teamBelongs->handle($request(['type' => 'team', 'id' => 11], 10), $next),
    403,
    'team entity cannot cross team boundaries'
);
try {
    $teamBelongs->handle($request(['type' => 'team', 'id' => 11], 10), $next);
    $failures[] = 'team mismatch error exposes the unified contract';
} catch (EntityContextException $exception) {
    $assertSame(40301, $exception->getCode(), 'team mismatch uses code 40301');
    $assertSame('team-10', $exception->data()['team_slug'] ?? null, 'team mismatch includes current team slug');
}
$assertThrows(
    fn () => $teamBelongs->handle($request(null, 10), $next),
    428,
    'teamless identity is rejected by the missing-entity contract'
);
$assertThrows(
    fn () => $teamBelongs->handle($request(['type' => 'team', 'id' => 10]), $next),
    400,
    'TeamBelongs requires a current team'
);
$assertThrows(
    fn () => $teamBelongs->handle(
        $request(['type' => 'team', 'id' => 10], 10, false),
        $next
    ),
    500,
    'TeamBelongs requires Context to run first'
);

$aliases = require dirname(__DIR__) . '/config/middleware.php';
$assert(
    ($aliases['alias']['EntityType'] ?? null) === EntityType::class
        && ($aliases['alias']['EntityRequired'] ?? null) === EntityRequired::class
        && ($aliases['alias']['TeamBelongs'] ?? null) === TeamBelongs::class
        && !isset($aliases['alias']['AutoMember'])
        && ($aliases['alias']['TeamAuth'] ?? null) === ['EntityRequired', 'TeamBelongs'],
    'middleware aliases expose entity checks and the TeamAuth group'
);
$priority = $aliases['priority'] ?? [];
$assert(
    array_search(EntityRequired::class, $priority, true) < array_search(EntityType::class, $priority, true)
        && array_search(EntityType::class, $priority, true) < array_search(TeamBelongs::class, $priority, true),
    'middleware priority requires an entity before entity type and team checks'
);

$middleware = static fn (string $class): array =>
    (new ReflectionClass($class))->getDefaultProperties()['middleware'] ?? [];
$has = static function (array $middleware, string $name): bool {
    foreach ($middleware as $key => $value) {
        $configured = is_int($key) ? $value : $key;
        if ($configured === $name) {
            return true;
        }
    }
    return false;
};
$generic = 'EntityType:team,teamMember,teamCustomer,teamVirtual';
$backendEntities = 'EntityType:team,teamMember,teamVirtual';
$assert(
    !$has($middleware(\app\account\controller\Team::class), 'EntityType:teamless')
        && $has($middleware(\app\account\controller\Team::class), 'JwtAuth'),
    'Account endpoints accept any valid login identity and use the user claim'
);
$assert(
    $has($middleware(\app\team\controller\Join::class), 'EntityType:teamless'),
    'team join applicant endpoints require teamless identity'
);
$assert(
    $has($middleware(\app\team\controller\Me::class), 'EntityType:teamMember')
        && $has($middleware(\app\team\controller\Me::class), 'TeamAuth'),
    'member self endpoints require a member and verify team belonging'
);
$assert(
    $has($middleware(\app\shop\controller\Customer::class), 'EntityType:teamCustomer')
        && $has($middleware(\app\shop\controller\Customer::class), 'TeamAuth'),
    'customer self endpoints require a customer belonging to the team'
);
$assert(
    $has($middleware(\app\transaction\controller\Transaction::class), $backendEntities)
        && $has($middleware(\app\transaction\controller\Transaction::class), 'TeamAuth'),
    'transaction backend accepts Team, member and virtual identities while customers stay in Shop'
);
$transactionBusinessControllers = [
    \app\transaction\controller\Transaction::class,
    \app\transaction\controller\Options::class,
    \app\transaction\controller\Service::class,
    \app\transaction\controller\Sender::class,
    \app\transaction\controller\Balance::class,
    \app\transaction\controller\Personal::class,
];
foreach ($transactionBusinessControllers as $controller) {
    $assert(
        $has($middleware($controller), $backendEntities)
            && $has($middleware($controller), 'TeamAuth')
            && $has($middleware($controller), 'Ability:transaction'),
        "{$controller} requires a backend Entity, current team and transaction Ability"
    );
}
$assert(
    !$has($middleware(\app\transaction\controller\Workspace::class), 'Ability:transaction'),
    'transaction workspace access remains available to explain a missing Ability'
);
$personalTransactionMiddleware = $middleware(\app\transaction\controller\Personal::class);
$assertSame(
    ['transactions', 'transaction', 'bindings'],
    $personalTransactionMiddleware['Permission:' . \app\service\PermissionDictionary::TRANSACTION_READ]['only'] ?? null,
    'personal service tasks keep their handler scope instead of borrowing transaction.read'
);
$identityMiddleware = $middleware(\app\account\controller\Identity::class);
$assert(
    isset($identityMiddleware['EntityType:teamless,team,teamMember,teamCustomer,teamVirtual'])
        && ($identityMiddleware['EntityType:teamless,team,teamMember,teamCustomer,teamVirtual']['only'] ?? null) === ['candidates', 'receive', 'target']
        && ($identityMiddleware[$generic]['only'] ?? null) === ['drop'],
    'Account identity candidates, receive and migration target accept roots or entities while drop requires an entity'
);
$integrationMiddleware = $middleware(\app\chat\controller\Integration::class);
$assert(
    ($integrationMiddleware[$generic]['except'] ?? null) === ['send']
        && ($integrationMiddleware['TeamAuth']['except'] ?? null) === ['send'],
    'external integration send bypasses entity middleware'
);
$entityMiddleware = $middleware(\app\team\controller\Entity::class);
$memberMiddleware = $middleware(\app\team\controller\Member::class);
$assert(
    !isset($entityMiddleware['Permission:' . \app\service\PermissionDictionary::TEAM_ENTITY_READ])
        && ($entityMiddleware['Permission:' . \app\service\PermissionDictionary::TEAM_ENTITY_PROFILE_MANAGE]['only'] ?? null)
            === ['profile', 'display', 'visibility'],
    'entity directory is a base read surface while profile and visibility writes require manage permission'
);
$assert(
    !in_array('index', $memberMiddleware['MemberAccess']['only'] ?? [], true)
        && !in_array('get', $memberMiddleware['MemberAccess']['only'] ?? [], true)
        && !isset($memberMiddleware['Permission:' . \app\service\PermissionDictionary::TEAM_MEMBER_READ]),
    'member directory is a base read surface and team.member.read only expands the result set'
);
$assert(
    $has($middleware(\app\team\controller\Access::class), 'TeamAuth')
        && $has($middleware(\app\team\controller\Dashboard::class), 'TeamAuth'),
    'access snapshot and dashboard are available to every entity belonging to the team'
);

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Entity middleware tests passed." . PHP_EOL);
