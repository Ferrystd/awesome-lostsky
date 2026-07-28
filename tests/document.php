<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\ManageScope;
use app\enum\Visibility;
use app\middleware\Ability;
use app\model\Document;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamMember;
use app\model\User;
use app\service\Document as DocumentService;
use app\service\Entity as EntityService;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$owner = new User;
$owner->save([
    'phone' => '17' . random_int(100000000, 999999999),
    'username' => "doc-owner-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$memberUser = new User;
$memberUser->save([
    'phone' => '18' . random_int(100000000, 999999999),
    'username' => "doc-member-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$team = new Team;
$team->save([
    'slug' => "doc-test-{$suffix}",
    'user_id' => $owner->id,
]);
$member = new TeamMember;
$member->save([
    'team_id' => $team->id,
    'user_id' => $memberUser->id,
    'is_blocked' => 0,
]);
$teamEntity = app(EntityService::class)->claimTeam($team);
$memberEntity = app(EntityService::class)->claimMember(
    (int) $team->id,
    (int) $member->id,
    "doc-member-{$suffix}"
);
$abilityIds = [];
$assertHttpStatus = static function (callable $callback, int $status, string $case): void {
    try {
        $callback();
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() === $status) {
            return;
        }
        throw new RuntimeException("{$case}: expected {$status}, got {$exception->getStatusCode()}");
    }

    throw new RuntimeException("{$case}: expected HttpException {$status}");
};

try {
    $public = new Document;
    $public->save([
        'title' => 'Public',
        'content' => null,
        'entity_id' => $teamEntity->id,
        'manager_scope' => ManageScope::Team,
        'visibility' => Visibility::Public,
        'sort' => 0,
    ]);
    $hidden = new Document;
    $hidden->save([
        'title' => 'Manager only',
        'content' => null,
        'entity_id' => $teamEntity->id,
        'manager_scope' => ManageScope::Team,
        'visibility' => Visibility::Team,
        'sort' => 0,
    ]);
    $entityDocument = new Document;
    $entityDocument->save([
        'title' => 'Entity document',
        'content' => null,
        'entity_id' => $memberEntity->id,
        'manager_scope' => ManageScope::SubjectTeam,
        'visibility' => Visibility::SubjectTeam,
        'sort' => 0,
    ]);

    if ((int) $team->documents()->where('document.id', $public->id)->count() !== 1
        || (int) $member->documents()->where('document.id', $entityDocument->id)->count() !== 1) {
        throw new RuntimeException('Document owner relations must use entity.id');
    }

    $result = app(DocumentService::class)->list(
        (int) $teamEntity->id,
        [],
        1,
        999,
        (int) $team->id,
        [
            'entity_id' => (int) $memberEntity->id,
            'type' => 'teamMember',
            'id' => (int) $member->id,
        ]
    );

    if ($result['total'] !== 1 || $result['limit'] !== 100
        || count($result['list']) !== 1 || $result['list'][0]['title'] !== 'Public') {
        throw new RuntimeException('Document visibility must be filtered before count and pagination');
    }

    $ability = new TeamAbility;
    $ability->save([
        'team_id' => $team->id,
        'ability_key' => 'doc',
        'level' => 2,
        'expire_time' => 0,
    ]);
    $abilityIds[] = $ability->id;

    $request = new Request;
    $request->team = $team;
    $next = static fn (Request $request): string => 'passed';
    $middleware = new Ability;
    if ($middleware->handle($request, $next, 'doc') !== 'passed') {
        throw new RuntimeException('Ability defaults the minimum level to 1');
    }
    if ($middleware->handle($request, $next, 'doc', '2') !== 'passed') {
        throw new RuntimeException('Ability accepts an explicit minimum level');
    }

    $aliases = require dirname(__DIR__) . '/config/middleware.php';
    if (($aliases['alias']['Ability'] ?? null) !== Ability::class
        || isset($aliases['alias']['TransactionAbility'], $aliases['alias']['DocAbility'])) {
        throw new RuntimeException('Ability is the only registered team capability middleware');
    }
    $transactionMiddleware = (new ReflectionClass(\app\transaction\controller\Transaction::class))
        ->getDefaultProperties()['middleware'] ?? [];
    $balanceMiddleware = (new ReflectionClass(\app\transaction\controller\Balance::class))
        ->getDefaultProperties()['middleware'] ?? [];
    $docMiddleware = (new ReflectionClass(\app\team\controller\Doc::class))
        ->getDefaultProperties()['middleware'] ?? [];
    if (!isset($transactionMiddleware['Ability:transaction'], $balanceMiddleware['Ability:transaction'])
        || !in_array('Ability:doc', $docMiddleware, true)) {
        throw new RuntimeException('Controllers declare the unified Ability middleware');
    }

    $assertHttpStatus(
        fn () => $middleware->handle($request, $next, 'transaction'),
        403,
        'Ability rejects a missing capability'
    );
    $assertHttpStatus(
        fn () => $middleware->handle($request, $next, 'doc', '3'),
        403,
        'Ability rejects an insufficient level'
    );
    $assertHttpStatus(
        fn () => $middleware->handle($request, $next, 'doc,2'),
        500,
        'Ability rejects comma-separated controller parameters'
    );
    $assertHttpStatus(
        fn () => $middleware->handle($request, $next, 'doc', '0'),
        500,
        'Ability rejects a non-positive minimum level'
    );
    $assertHttpStatus(
        fn () => $middleware->handle(new Request, $next, 'doc'),
        400,
        'Ability requires a team context'
    );

    $ability->expire_time = time() - 1;
    $ability->save();
    $assertHttpStatus(
        fn () => $middleware->handle($request, $next, 'doc'),
        403,
        'Ability rejects an expired capability'
    );
} finally {
    Document::destroy([$public->id ?? 0, $hidden->id ?? 0, $entityDocument->id ?? 0], true);
    if ($abilityIds) {
        TeamAbility::destroy($abilityIds, true);
    }
    app()->db->name('team_entity_profile')
        ->whereIn('entity_id', [$teamEntity->id, $memberEntity->id])
        ->delete();
    \app\model\Entity::destroy([$teamEntity->id, $memberEntity->id], true);
    TeamMember::destroy($member->id, true);
    Team::destroy($team->id, true);
    User::destroy([$owner->id, $memberUser->id], true);
}

fwrite(STDOUT, "Document backend tests passed\n");
