<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\ManageScope;
use app\enum\TeamMemberStatus;
use app\enum\Visibility;
use app\middleware\Ability;
use app\model\Document;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamCustomer;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
use app\model\User;
use app\service\Document as DocumentService;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\PermissionDictionary;
use app\service\RolePermission;
use app\service\TeamDashboard;
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
    'status' => TeamMemberStatus::Active,
]);
$teamEntity = app(EntityService::class)->claimTeam($team);
$memberEntity = app(EntityService::class)->claimMember(
    (int) $team->id,
    (int) $member->id,
    "doc-member-{$suffix}"
);
$customerA = new TeamCustomer;
$customerA->save(['team_id' => (int) $team->id, 'user_id' => null, 'is_blocked' => 0]);
$customerAEntity = app(EntityService::class)->claimCustomer(
    (int) $customerA->id,
    "doc-customer-a-{$suffix}"
);
$customerB = new TeamCustomer;
$customerB->save(['team_id' => (int) $team->id, 'user_id' => null, 'is_blocked' => 0]);
$customerBEntity = app(EntityService::class)->claimCustomer(
    (int) $customerB->id,
    "doc-customer-b-{$suffix}"
);
$virtual = new TeamVirtual;
$virtual->save(['team_id' => (int) $team->id, 'name' => 'Document virtual', 'is_active' => 1]);
$virtualEntity = app(EntityService::class)->claimVirtual(
    $virtual,
    "doc-virtual-{$suffix}"
);
$foreignTeam = new Team;
$foreignTeam->save(['slug' => "doc-foreign-{$suffix}", 'user_id' => $owner->id]);
$foreignTeamEntity = app(EntityService::class)->claimTeam($foreignTeam);
$foreignCustomer = new TeamCustomer;
$foreignCustomer->save(['team_id' => (int) $foreignTeam->id, 'user_id' => null, 'is_blocked' => 0]);
$foreignCustomerEntity = app(EntityService::class)->claimCustomer(
    (int) $foreignCustomer->id,
    "doc-foreign-customer-{$suffix}"
);
$abilityIds = [];
$managedDocumentIds = [];
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
        'content' => 'Runbook recovery phrase',
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
    $customerHiddenDocument = new Document;
    $customerHiddenDocument->save([
        'title' => 'Customer hidden document',
        'content' => null,
        'entity_id' => $customerAEntity->id,
        'manager_scope' => ManageScope::Team,
        'visibility' => Visibility::Custom,
        'sort' => 0,
    ]);
    $managedDocumentIds[] = (int) $customerHiddenDocument->id;

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
    if (($result['list'][0]['tags'] ?? null) !== []) {
        throw new RuntimeException('Legacy null document tags are returned as an empty array in lists');
    }

    $ability = new TeamAbility;
    $ability->save([
        'team_id' => $team->id,
        'ability_key' => 'doc',
        'level' => 2,
        'expire_time' => 0,
    ]);
    $abilityIds[] = $ability->id;

    $summary = app(TeamDashboard::class)->summary(
        (int) $team->id,
        [
            'entity_id' => (int) $memberEntity->id,
            'type' => 'teamMember',
            'id' => (int) $member->id,
        ]
    );
    if ($summary['documents']['count'] !== null || !$summary['documents']['available']) {
        throw new RuntimeException('Document dashboard metric requires team.document.read for a count');
    }

    $documentReaderRole = new TeamRole;
    $documentReaderRole->save([
        'team_id' => (int) $team->id,
        'role_key' => "document_reader_{$suffix}",
        'name' => 'Document reader',
        'description' => null,
        'sort' => 10,
        'is_displayed' => 0,
    ]);
    $documentReaderPermission = new TeamRolePermission;
    $documentReaderPermission->save([
        'team_id' => (int) $team->id,
        'role_id' => (int) $documentReaderRole->id,
        'permission_key' => PermissionDictionary::TEAM_DOCUMENT_READ,
    ]);
    $documentReaderBinding = new TeamEntityRole;
    $documentReaderBinding->save([
        'team_id' => (int) $team->id,
        'entity_id' => (int) $memberEntity->id,
        'role_id' => (int) $documentReaderRole->id,
    ]);

    $fullResult = app(DocumentService::class)->list(
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
    if ($fullResult['total'] !== 2) {
        throw new RuntimeException('team.document.read must expose all Team documents');
    }
    $contentSearch = app(DocumentService::class)->list(
        (int) $teamEntity->id,
        ['keyword' => 'recovery phrase'],
        1,
        20,
        (int) $team->id,
        [
            'entity_id' => (int) $memberEntity->id,
            'type' => 'teamMember',
            'id' => (int) $member->id,
        ]
    );
    if ($contentSearch['total'] !== 1 || $contentSearch['list'][0]['title'] !== 'Public') {
        throw new RuntimeException('Document keyword search must include Markdown content');
    }
    app(DocumentService::class)->get(
        (int) $hidden->id,
        (int) $team->id,
        [
            'entity_id' => (int) $memberEntity->id,
            'type' => 'teamMember',
            'id' => (int) $member->id,
        ]
    );

    $summary = app(TeamDashboard::class)->summary(
        (int) $team->id,
        [
            'entity_id' => (int) $memberEntity->id,
            'type' => 'teamMember',
            'id' => (int) $member->id,
        ]
    );
    if ($summary['documents']['count'] !== 2) {
        throw new RuntimeException('Document dashboard metric shows a count with team.document.read');
    }

    $memberActor = [
        'entity_id' => (int) $memberEntity->id,
        'type' => 'teamMember',
        'id' => (int) $member->id,
    ];
    app(DocumentService::class)->get(
        (int) $customerHiddenDocument->id,
        (int) $team->id,
        $memberActor
    );
    $assertHttpStatus(
        fn () => app(DocumentService::class)->create((int) $teamEntity->id, [
            'title' => 'Read is not write',
        ], (int) $team->id, $memberActor),
        403,
        'team.document.read does not grant document management'
    );
    app(DocumentService::class)->edit(
        (int) $entityDocument->id,
        ['title' => 'Entity document edited by subject'],
        (int) $team->id,
        $memberActor
    );
    $assertHttpStatus(
        fn () => app(DocumentService::class)->create((int) $memberEntity->id, [
            'title' => 'Subject cannot choose manager-only scope',
            'manager_scope' => ManageScope::Team->value,
            'visibility' => Visibility::Team->value,
        ], (int) $team->id, $memberActor),
        403,
        'the document subject only manages SubjectTeam documents by default'
    );

    $documentManagerRole = new TeamRole;
    $documentManagerRole->save([
        'team_id' => (int) $team->id,
        'role_key' => "document_manager_{$suffix}",
        'name' => 'Document manager',
        'description' => null,
        'sort' => 11,
        'is_displayed' => 0,
    ]);
    $documentManagerBinding = new TeamEntityRole;
    $documentManagerBinding->save([
        'team_id' => (int) $team->id,
        'entity_id' => (int) $memberEntity->id,
        'role_id' => (int) $documentManagerRole->id,
    ]);
    $documentManagerTeamBinding = new TeamEntityRole;
    $documentManagerTeamBinding->save([
        'team_id' => (int) $team->id,
        'entity_id' => (int) $teamEntity->id,
        'role_id' => (int) $documentManagerRole->id,
    ]);
    app(RolePermission::class)->save((int) $team->id, (int) $documentManagerRole->id, [
        PermissionDictionary::documentManage('teamCustomer', (string) $customerAEntity->slug),
    ]);
    $assertHttpStatus(
        fn () => app(RolePermission::class)->save((int) $team->id, (int) $documentManagerRole->id, [
            PermissionDictionary::documentManage('teamCustomer', (string) $foreignCustomerEntity->slug),
        ]),
        422,
        'specific document management permissions reject cross-team entities'
    );
    app(RolePermission::class)->save((int) $team->id, (int) $documentManagerRole->id, [
        PermissionDictionary::documentManage('teamCustomer', (string) $customerAEntity->slug),
    ]);
    $customerSpecificId = app(DocumentService::class)->create((int) $customerAEntity->id, [
        'title' => 'Specific customer document',
        'manager_scope' => ManageScope::Team->value,
        'visibility' => Visibility::Custom->value,
    ], (int) $team->id, $memberActor);
    $managedDocumentIds[] = $customerSpecificId;
    app(DocumentService::class)->get($customerSpecificId, (int) $team->id, $memberActor);
    app(DocumentService::class)->edit(
        $customerSpecificId,
        ['title' => 'Specific customer document edited'],
        (int) $team->id,
        $memberActor
    );
    app(DocumentService::class)->delete($customerSpecificId, (int) $team->id, $memberActor);
    $assertHttpStatus(
        fn () => app(DocumentService::class)->create((int) $customerBEntity->id, [
            'title' => 'Sibling customer denied',
        ], (int) $team->id, $memberActor),
        403,
        'specific document management permissions do not cover sibling entities'
    );

    app(RolePermission::class)->save((int) $team->id, (int) $documentManagerRole->id, [
        PermissionDictionary::TEAM_DOCUMENT_TEAM_MANAGE,
        PermissionDictionary::TEAM_DOCUMENT_CUSTOMER_ALL_MANAGE,
        PermissionDictionary::documentManage('teamVirtual', (string) $virtualEntity->slug),
    ]);
    $customerWildcardId = app(DocumentService::class)->create((int) $customerBEntity->id, [
        'title' => 'Wildcard customer document',
    ], (int) $team->id, $memberActor);
    $managedDocumentIds[] = $customerWildcardId;
    $virtualSpecificId = app(DocumentService::class)->create((int) $virtualEntity->id, [
        'title' => 'Specific virtual document',
    ], (int) $team->id, $memberActor);
    $managedDocumentIds[] = $virtualSpecificId;

    $teamActor = [
        'entity_id' => (int) $teamEntity->id,
        'type' => 'team',
        'id' => (int) $team->id,
    ];
    $taggedId = app(DocumentService::class)->create((int) $teamEntity->id, [
        'title' => 'Tagged document',
        'content' => '',
        'manager_scope' => ManageScope::Team->value,
        'visibility' => Visibility::Public->value,
        'tags' => ['  说明 文档！  ', 'A', 'a', '说明 文档！'],
    ], (int) $team->id, $teamActor);
    $tagged = Document::find($taggedId);
    if (!$tagged || $tagged->tags !== ['说明 文档！', 'A', 'a']) {
        throw new RuntimeException('Document tags are trimmed, ordered, deduplicated and case-sensitive');
    }
    if (app(DocumentService::class)->get($taggedId, (int) $team->id, $teamActor)['tags'] !== ['说明 文档！', 'A', 'a']) {
        throw new RuntimeException('Document detail returns normalized tags');
    }
    app(DocumentService::class)->edit($taggedId, ['sort' => 8], (int) $team->id, $teamActor);
    if (Document::find($taggedId)?->tags !== ['说明 文档！', 'A', 'a']) {
        throw new RuntimeException('Omitted document tags retain their previous value');
    }
    app(DocumentService::class)->edit($taggedId, ['tags' => null], (int) $team->id, $teamActor);
    if (Document::find($taggedId)?->tags !== []) {
        throw new RuntimeException('Null document tags clear the value');
    }
    $tagged->save(['tags' => null]);
    if (app(DocumentService::class)->get($taggedId, (int) $team->id, $teamActor)['tags'] !== []) {
        throw new RuntimeException('Legacy null document tags are returned as an empty array');
    }
    foreach ([[123], ['#tag'], ["line\nbreak"], ['']] as $invalidTags) {
        $assertHttpStatus(
            fn () => app(DocumentService::class)->create((int) $teamEntity->id, [
                'title' => 'Invalid tags',
                'tags' => $invalidTags,
            ], (int) $team->id, $teamActor),
            422,
            'Document tag validation rejects invalid values'
        );
    }
    $assertHttpStatus(
        fn () => app(DocumentService::class)->create((int) $teamEntity->id, [
            'title' => 'Invalid tag type',
            'tags' => 'not-an-array',
        ], (int) $team->id, $teamActor),
        422,
        'Document tag validation rejects a non-array value'
    );

    $profiles = app(EntityProfile::class);
    $profiles->update((int) $team->id, (int) $teamEntity->id, [
        'document_tags' => [
            ['tag' => '  说明 文档！  ', 'description' => '  用于介绍  '],
            ['tag' => 'A', 'description' => ''],
        ],
    ]);
    $profile = $profiles->get((int) $team->id, (int) $teamEntity->id, true)['profile'];
    if (($profile['document_tags'] ?? null) !== [
        ['tag' => '说明 文档！', 'description' => '用于介绍'],
        ['tag' => 'A', 'description' => null],
    ]) {
        throw new RuntimeException('Document display tags preserve order and normalize descriptions');
    }
    $profiles->update((int) $team->id, (int) $teamEntity->id, ['name' => 'Tags team']);
    if (($profiles->get((int) $team->id, (int) $teamEntity->id, true)['profile']['document_tags'] ?? null) !== [
        ['tag' => '说明 文档！', 'description' => '用于介绍'],
        ['tag' => 'A', 'description' => null],
    ]) {
        throw new RuntimeException('Omitted document display tags retain their previous value');
    }
    $profiles->update((int) $team->id, (int) $memberEntity->id, [
        'document_tags' => [['tag' => '说明 文档！', 'description' => '成员说明']],
    ]);
    if (($profiles->get((int) $team->id, (int) $memberEntity->id, true)['profile']['document_tags'][0]['description'] ?? null) !== '成员说明') {
        throw new RuntimeException('Document display tags are isolated by entity');
    }
    foreach ([
        [['tag' => '重复'], ['tag' => '重复']],
        [['tag' => '说明', 'description' => str_repeat('x', 256)]],
        [['tag' => "bad\tlabel"]],
    ] as $invalidDocumentTags) {
        $assertHttpStatus(
            fn () => $profiles->update((int) $team->id, (int) $teamEntity->id, ['document_tags' => $invalidDocumentTags]),
            422,
            'Document display tag validation rejects invalid values'
        );
    }
    $profiles->update((int) $team->id, (int) $teamEntity->id, ['document_tags' => null]);
    if (($profiles->get((int) $team->id, (int) $teamEntity->id, true)['profile']['document_tags'] ?? null) !== []) {
        throw new RuntimeException('Null document display tags clear the value');
    }
    \app\model\TeamEntityProfile::where('entity_id', (int) $teamEntity->id)->find()?->save(['document_tags' => null]);
    if (($profiles->get((int) $team->id, (int) $teamEntity->id, true)['profile']['document_tags'] ?? null) !== []) {
        throw new RuntimeException('Legacy null document display tags are returned as an empty array');
    }
    $assertHttpStatus(
        fn () => $profiles->update((int) $team->id, (int) $teamEntity->id, ['document_tags' => 'not-an-array']),
        422,
        'Document display tags reject a non-array value'
    );

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
    if (($transactionMiddleware['Ability:transaction']['only'] ?? null) !== ['create']
        || ($balanceMiddleware['Ability:transaction']['only'] ?? null) !== ['recharge']
        || !in_array('Ability:doc', $docMiddleware, true)) {
        throw new RuntimeException('Controllers declare action-scoped Ability middleware');
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
    if (isset($documentManagerTeamBinding)) TeamEntityRole::destroy((int) $documentManagerTeamBinding->id, true);
    if (isset($documentManagerBinding)) TeamEntityRole::destroy((int) $documentManagerBinding->id, true);
    if (isset($documentManagerRole)) {
        $documentManagerPermissionIds = TeamRolePermission::withTrashed()
            ->where('role_id', (int) $documentManagerRole->id)
            ->column('id');
        if ($documentManagerPermissionIds) TeamRolePermission::destroy($documentManagerPermissionIds, true);
        TeamRole::destroy((int) $documentManagerRole->id, true);
    }
    if (isset($documentReaderBinding)) TeamEntityRole::destroy((int) $documentReaderBinding->id, true);
    if (isset($documentReaderPermission)) TeamRolePermission::destroy((int) $documentReaderPermission->id, true);
    if (isset($documentReaderRole)) TeamRole::destroy((int) $documentReaderRole->id, true);
    Document::destroy(array_merge(
        [$public->id ?? 0, $hidden->id ?? 0, $entityDocument->id ?? 0, $tagged->id ?? 0],
        $managedDocumentIds
    ), true);
    if ($abilityIds) {
        TeamAbility::destroy($abilityIds, true);
    }
    app()->db->name('team_entity_profile')
        ->whereIn('entity_id', [
            $teamEntity->id,
            $memberEntity->id,
            $customerAEntity->id,
            $customerBEntity->id,
            $virtualEntity->id,
            $foreignTeamEntity->id,
            $foreignCustomerEntity->id,
        ])
        ->delete();
    \app\model\Entity::destroy([
        $teamEntity->id,
        $memberEntity->id,
        $customerAEntity->id,
        $customerBEntity->id,
        $virtualEntity->id,
        $foreignTeamEntity->id,
        $foreignCustomerEntity->id,
    ], true);
    TeamCustomer::destroy([$customerA->id, $customerB->id, $foreignCustomer->id], true);
    TeamVirtual::destroy($virtual->id, true);
    TeamMember::destroy($member->id, true);
    Team::destroy($foreignTeam->id, true);
    Team::destroy($team->id, true);
    User::destroy([$owner->id, $memberUser->id], true);
}

fwrite(STDOUT, "Document backend tests passed\n");
