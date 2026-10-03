<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\EntityType;
use app\middleware\EntityRequired;
use app\middleware\TeamBelongs;
use app\middleware\TeamWorkspaceAccess;
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
    $entityRequired->handle($request(), $next);
    $failures[] = 'teamless missing entity error exposes the unified contract';
} catch (EntityContextException $exception) {
    $assertSame(42801, $exception->getCode(), 'teamless missing entity uses code 42801');
    $assertSame(null, $exception->data()['team_slug'] ?? null, 'teamless missing entity has no recovery team slug');
}
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
        && ($aliases['alias']['TeamWorkspaceAccess'] ?? null) === TeamWorkspaceAccess::class
        && !isset($aliases['alias']['AutoMember'])
        && ($aliases['alias']['TeamAuth'] ?? null) === ['EntityRequired', 'TeamBelongs']
        && ($aliases['alias']['TeamWorkspaceAuth'] ?? null) === ['EntityRequired', 'TeamWorkspaceAccess'],
    'middleware aliases expose strict and cross-team workspace authorization groups'
);
$priority = $aliases['priority'] ?? [];
$assert(
    array_search(EntityRequired::class, $priority, true) < array_search(EntityType::class, $priority, true)
        && array_search(EntityType::class, $priority, true) < array_search(TeamBelongs::class, $priority, true)
        && array_search(EntityType::class, $priority, true) < array_search(TeamWorkspaceAccess::class, $priority, true),
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
$workspaceEntities = 'EntityType:team,teamMember,teamCustomer,teamVirtual';
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
$personalProductMiddleware = $middleware(\app\shop\controller\PersonalProduct::class);
$assert(
    $has($personalProductMiddleware, $backendEntities)
        && $has($personalProductMiddleware, 'TeamAuth')
        && $has($personalProductMiddleware, 'Permission:' . \app\service\PermissionDictionary::SHOP_PRODUCT_SELF_MANAGE),
    'personal products require a backend Entity, current team and self management permission'
);
$personalEntitlementMiddleware = $middleware(\app\shop\controller\PersonalEntitlement::class);
$assert(
    $has($personalEntitlementMiddleware, $backendEntities)
        && $has($personalEntitlementMiddleware, 'TeamAuth')
        && $has($personalEntitlementMiddleware, 'Permission:' . \app\service\PermissionDictionary::SHOP_PRODUCT_SELF_MANAGE),
    'personal services, packages, campaigns and codes require the current Entity self management permission'
);
$shopBackendControllers = [
    \app\shop\controller\Product::class,
    \app\shop\controller\PersonalProduct::class,
    \app\shop\controller\Order::class,
    \app\shop\controller\Manage::class,
];
foreach ($shopBackendControllers as $controller) {
    $assert(
        !$has($middleware($controller), 'Ability:shop'),
        "{$controller} keeps Shop Ability outside backend product and order management"
    );
}
$transactionTeamControllers = [
    \app\transaction\controller\Transaction::class,
    \app\transaction\controller\Options::class,
    \app\transaction\controller\Service::class,
    \app\transaction\controller\Balance::class,
];
foreach ($transactionTeamControllers as $controller) {
    $assert(
        $has($middleware($controller), $workspaceEntities)
            && $has($middleware($controller), 'TeamWorkspaceAuth'),
        "{$controller} accepts globally valid entities with a target-team role"
    );
}
$assert(
    $has($middleware(\app\transaction\controller\Personal::class), $backendEntities)
        && $has($middleware(\app\transaction\controller\Personal::class), 'TeamAuth'),
    'personal transaction endpoints remain limited to an internal backend Entity'
);
$assert(
    $has($middleware(\app\transaction\controller\EntitlementGrant::class), $workspaceEntities)
        && $has($middleware(\app\transaction\controller\EntitlementGrant::class), 'TeamWorkspaceAuth')
        && $has($middleware(\app\transaction\controller\EntitlementGrant::class), 'TeamAuth'),
    'entitlement grants use cross-team authorization only for team-scoped actions'
);
$assertSame(
    ['create'],
    $middleware(\app\transaction\controller\Transaction::class)['Ability:transaction']['only'] ?? null,
    'transaction Ability is checked only when a new manual transaction is saved'
);
$assertSame(
    ['recharge'],
    $middleware(\app\transaction\controller\Balance::class)['Ability:transaction']['only'] ?? null,
    'transaction Ability is checked only when a recharge is confirmed'
);
$assertSame(
    ['create', 'personalCreate'],
    $middleware(\app\transaction\controller\EntitlementGrant::class)['Ability:transaction']['only'] ?? null,
    'transaction Ability is checked only when a team or personal entitlement grant is submitted'
);
$assertSame(
    ['acceptServiceOffer'],
    $middleware(\app\transaction\controller\Personal::class)['Ability:transaction']['only'] ?? null,
    'transaction Ability is checked only when an assignment invitation is accepted'
);
$assert(
    !isset($middleware(\app\transaction\controller\Options::class)['Ability:transaction'])
        && !isset($middleware(\app\transaction\controller\Service::class)['Ability:transaction']),
    'transaction reads and redemption management do not require transaction Ability'
);
$assert(
    $has(
        $middleware(\app\transaction\controller\EntitlementGrant::class),
        'Permission:' . \app\service\PermissionDictionary::TRANSACTION_WRITE
    )
        && $has(
            $middleware(\app\transaction\controller\EntitlementGrant::class),
            'Permission:' . \app\service\PermissionDictionary::SERVICE_ENTITLEMENT_GRANT
        )
        && $has($middleware(\app\transaction\controller\EntitlementGrant::class), 'TransactionVerify'),
    'team and personal entitlement grants use distinct permissions and customer scope checks'
);
$entitlementGrantMiddleware = $middleware(\app\transaction\controller\EntitlementGrant::class);
$personalTransactionMiddleware = $middleware(\app\transaction\controller\Personal::class);
$assertSame(
    ['transactionOptions'],
    $personalTransactionMiddleware['Permission:' . \app\service\PermissionDictionary::TRANSACTION_WRITE]['only'] ?? null,
    'personal transaction options require transaction.write'
);
$assertSame(
    ['options', 'create'],
    $entitlementGrantMiddleware['Permission:' . \app\service\PermissionDictionary::TRANSACTION_WRITE]['only'] ?? null,
    'team entitlement grant actions retain transaction.write'
);
$assertSame(
    ['personalOptions', 'personalCreate'],
    $entitlementGrantMiddleware['Permission:' . \app\service\PermissionDictionary::SERVICE_ENTITLEMENT_GRANT]['only'] ?? null,
    'personal entitlement grant actions require the dedicated permission'
);
$assert(
    !in_array('personalHistory', $entitlementGrantMiddleware['Permission:' . \app\service\PermissionDictionary::SERVICE_ENTITLEMENT_GRANT]['only'] ?? [], true),
    'personal entitlement history remains readable without the grant permission'
);
$assert(
    !$has($middleware(\app\transaction\controller\Workspace::class), 'Ability:transaction'),
    'transaction workspace access remains available to explain a missing Ability'
);
$personalTransactionMiddleware = $middleware(\app\transaction\controller\Personal::class);
$assert(
    !isset($personalTransactionMiddleware['Permission:' . \app\service\PermissionDictionary::TRANSACTION_READ])
        && !isset($personalTransactionMiddleware['Permission:' . \app\service\PermissionDictionary::TRANSACTION_REPORT_READ]),
    'personal transaction reads use acting Entity scope without Team-wide permissions'
);
$serviceRedemptionMiddleware = $middleware(\app\transaction\controller\Service::class);
$serviceRedemptionReadGate = 'Permission:'
    . \app\service\PermissionDictionary::SERVICE_REDEMPTION_READ
    . ','
    . \app\service\PermissionDictionary::SERVICE_REDEMPTION_MANAGE;
$assertSame(
    ['index', 'get', 'handlers'],
    $serviceRedemptionMiddleware[$serviceRedemptionReadGate]['only'] ?? null,
    'team service redemption reads require read or manage permission'
);
$assertSame(
    ['approveCancel', 'rejectCancel', 'reassign', 'complete', 'reject', 'createAdjustment', 'cancelAdjustment'],
    $serviceRedemptionMiddleware['Permission:' . \app\service\PermissionDictionary::SERVICE_REDEMPTION_MANAGE]['only'] ?? null,
    'team service redemption writes require manage permission'
);
$identityMiddleware = $middleware(\app\account\controller\Identity::class);
$assert(
    isset($identityMiddleware['EntityType:teamless,team,teamMember,teamCustomer,teamVirtual'])
        && ($identityMiddleware['EntityType:teamless,team,teamMember,teamCustomer,teamVirtual']['only'] ?? null) === ['candidates', 'receive', 'target']
        && ($identityMiddleware[$generic]['only'] ?? null) === ['drop', 'workspaceWarning', 'acknowledgeWorkspaceWarning'],
    'Account identity selection accepts roots while drop and workspace warning actions require an entity'
);
$integrationMiddleware = $middleware(\app\chat\controller\Integration::class);
$assert($integrationMiddleware === [], 'external integration endpoint has no user or Entity middleware');
$chatConversationMiddleware = $middleware(\app\chat\controller\Conversation::class);
$assert(
    $has($chatConversationMiddleware, 'EntityRequired')
        && !$has($chatConversationMiddleware, 'TeamAuth')
        && !$has($chatConversationMiddleware, 'ChatAccess'),
    'Chat conversation endpoints require only a current Entity and no team context'
);
$entityMiddleware = $middleware(\app\team\controller\Entity::class);
$memberMiddleware = $middleware(\app\team\controller\Member::class);
$assert(
    !isset($entityMiddleware['Permission:' . \app\service\PermissionDictionary::TEAM_ENTITY_READ])
        && ($entityMiddleware['Permission:' . \app\service\PermissionDictionary::TEAM_ENTITY_PROFILE_MANAGE]['only'] ?? null)
            === ['profile', 'display', 'visibility', 'presentation'],
    'entity directory is a base read surface while profile and visibility writes require manage permission'
);
$assert(
    !in_array('index', $memberMiddleware['MemberAccess']['only'] ?? [], true)
        && !in_array('get', $memberMiddleware['MemberAccess']['only'] ?? [], true)
        && !isset($memberMiddleware['Permission:' . \app\service\PermissionDictionary::TEAM_MEMBER_READ]),
    'member directory is a base read surface and team.member.read only expands the result set'
);
$assert(
    $has($middleware(\app\team\controller\Access::class), 'TeamWorkspaceAuth')
        && $has($middleware(\app\team\controller\Dashboard::class), 'TeamWorkspaceAuth'),
    'access snapshot and dashboard accept internal entities or external entities with a target-team role'
);

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Entity middleware tests passed." . PHP_EOL);
