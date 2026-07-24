<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\EntityType;
use app\middleware\TeamBelongs;
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
$assertThrows(
    fn () => $teamBelongs->handle($request(null, 10), $next),
    403,
    'teamless identity does not belong to a team'
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
        && ($aliases['alias']['TeamBelongs'] ?? null) === TeamBelongs::class,
    'middleware aliases expose EntityType and TeamBelongs'
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
$assert(
    $has($middleware(\app\account\controller\Team::class), 'EntityType:teamless'),
    'Account team endpoints require teamless identity'
);
$assert(
    $has($middleware(\app\team\controller\Join::class), 'EntityType:teamless'),
    'team join applicant endpoints require teamless identity'
);
$assert(
    $has($middleware(\app\team\controller\Me::class), 'EntityType:teamMember')
        && $has($middleware(\app\team\controller\Me::class), 'TeamBelongs'),
    'member self endpoints require a member belonging to the team'
);
$assert(
    $has($middleware(\app\shop\controller\Customer::class), 'EntityType:teamCustomer')
        && $has($middleware(\app\shop\controller\Customer::class), 'TeamBelongs'),
    'customer self endpoints require a customer belonging to the team'
);
$assert(
    $has($middleware(\app\transaction\controller\Transaction::class), $generic)
        && $has($middleware(\app\transaction\controller\Transaction::class), 'TeamBelongs'),
    'generic team business accepts all team entity types and checks belonging'
);
$identityMiddleware = $middleware(\app\chat\controller\Identity::class);
$assert(
    $has($identityMiddleware, 'EntityType:teamless')
        && $has($identityMiddleware, $generic),
    'identity receive and drop declare separate type policies'
);
$integrationMiddleware = $middleware(\app\chat\controller\Integration::class);
$assert(
    ($integrationMiddleware[$generic]['except'] ?? null) === ['send']
        && ($integrationMiddleware['TeamBelongs']['except'] ?? null) === ['send'],
    'external integration send bypasses entity middleware'
);

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Entity middleware tests passed." . PHP_EOL);
