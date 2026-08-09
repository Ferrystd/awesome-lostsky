<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\middleware\TeamBelongs;
use app\model\ChatEventOutbox;
use app\model\ChatMessage;
use app\model\Entity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\TeamEntityRole;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
use app\model\User;
use app\model\UserDevice;
use app\service\ChatActor;
use app\service\ChatConversation;
use app\service\ChatMessage as ChatMessageService;
use app\service\ChatVirtual;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\IdentitySession;
use app\service\PermissionDictionary;
use app\service\PermissionGate;
use app\service\RolePermission;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();
$jwtConfig = config('jwt');
$jwtConfig['secret'] = str_repeat('b', 64);
app()->config->set($jwtConfig, 'jwt');

set_exception_handler(static function (Throwable $exception): void {
    fwrite(
        STDERR,
        $exception::class . ': ' . $exception->getMessage()
            . " at {$exception->getFile()}:{$exception->getLine()}" . PHP_EOL
            . $exception->getTraceAsString() . PHP_EOL
    );
    exit(1);
});

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

$suffix = bin2hex(random_bytes(6));
$db = app()->db;
$db->startTrans();
try {
    $user = new User;
    $user->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'email' => null,
        'password' => password_hash('chat-test', PASSWORD_DEFAULT),
        'username' => "chat-test-{$suffix}",
    ]);
    $foreignUser = new User;
    $foreignUser->save([
        'phone' => '17' . random_int(100000000, 999999999),
        'email' => null,
        'password' => password_hash('chat-test', PASSWORD_DEFAULT),
        'username' => "chat-foreign-{$suffix}",
    ]);
    $hiddenUser = new User;
    $hiddenUser->save([
        'phone' => '16' . random_int(100000000, 999999999),
        'email' => null,
        'password' => password_hash('chat-test', PASSWORD_DEFAULT),
        'username' => "chat-hidden-{$suffix}",
    ]);
    foreach (['chat-test-device', 'chat-team-device', 'chat-virtual-device'] as $deviceToken) {
        $device = new UserDevice;
        $device->save([
            'user_id' => (int) $user->id,
            'device_token' => $deviceToken,
            'device_name' => 'Chat Test',
            'ua' => 'tests/chat_backend.php',
            'last_active_time' => time(),
        ]);
    }

    $team = new Team;
    $team->save([
        'slug' => "chat-test-{$suffix}",
        'user_id' => (int) $user->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    $teamEntity = app(EntityService::class)->claimTeam($team);
    app(EntityProfile::class)->update((int) $team->id, (int) $teamEntity->id, ['name' => 'Chat Test']);
    $settingSchema = app(\app\service\TeamSetting::class)->schema((int) $team->id);
    $settingApps = [];
    foreach ($settingSchema['apps'] as $settingApp) {
        $settingApps[$settingApp['app_name']] = $settingApp;
    }
    $assertSame(['entity', 'member', 'chat', 'shop', 'display'], array_keys($settingApps), 'team setting apps keep their configured order');
    $chatSettingFields = [];
    foreach ($settingApps['chat']['settings'] ?? [] as $settingField) {
        $chatSettingFields[$settingField['key']] = $settingField;
    }
    $assertSame(
        [
            'customer_direct_start',
            'customer_group_mode',
            'group_history',
            'read_receipts',
            'edit_window_minutes',
            'revoke_window_minutes',
            'retention_days',
        ],
        array_keys($chatSettingFields),
        'chat settings keep their configured order'
    );
    $assertSame(
        'radio',
        $chatSettingFields['customer_group_mode']['control'] ?? null,
        'customer group mode uses the shared enum choice control'
    );
    $assertSame(
        ['禁止客户加入', '仅限团队邀请', '允许客户创建'],
        array_column($chatSettingFields['customer_group_mode']['options'] ?? [], 'label'),
        'customer group mode exposes localized option labels'
    );
    $assertSame(
        ['仅加入后消息', '全部历史消息'],
        array_column($chatSettingFields['group_history']['options'] ?? [], 'label'),
        'group history exposes localized option labels'
    );
    foreach (['customer_group_mode', 'group_history'] as $settingKey) {
        $assert(
            array_reduce(
                $chatSettingFields[$settingKey]['options'] ?? [],
                static fn (bool $carry, array $option): bool =>
                    $carry && trim((string) ($option['description'] ?? '')) !== '',
                true
            ),
            "{$settingKey} exposes a description for every option"
        );
    }
    $displaySettingFields = [];
    foreach ($settingApps['display']['settings'] ?? [] as $settingField) {
        $displaySettingFields[$settingField['key']] = $settingField;
    }
    $assertSame(
        [
            'homepage_welcome' => '欢迎来到我们的公开主页',
            'homepage_entities_link' => '浏览公开实体',
            'homepage_entities_title' => '公开实体',
            'homepage_entities_description' => '团队成员与虚拟实体',
            'homepage_entities_empty' => '团队暂时没有公开实体',
        ],
        array_map(static fn (array $field): mixed => $field['default'], $displaySettingFields),
        'display homepage copy settings expose their configured defaults'
    );
    $foreignTeam = new Team;
    $foreignTeam->save([
        'slug' => "chat-foreign-{$suffix}",
        'user_id' => (int) $foreignUser->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    $foreignTeamEntity = app(EntityService::class)->claimTeam($foreignTeam);

    $member = new TeamMember;
    $member->save([
        'team_id' => $team->id,
        'user_id' => $team->user_id,
        'status' => TeamMemberStatus::Active,
    ]);
    $memberSlug = "chat-member-{$suffix}";
    $memberEntity = app(EntityService::class)->claimMember((int) $team->id, (int) $member->id, $memberSlug);
    app(EntityProfile::class)->update(
        (int) $team->id,
        (int) $memberEntity->id,
        ['name' => 'Chat Member', 'avatar' => '']
    );

    $hiddenMember = new TeamMember;
    $hiddenMember->save([
        'team_id' => $team->id,
        'user_id' => (int) $hiddenUser->id,
        'status' => TeamMemberStatus::Active,
    ]);
    $hiddenMemberSlug = "chat-hidden-{$suffix}";
    $hiddenMemberEntity = app(EntityService::class)->claimMember(
        (int) $team->id,
        (int) $hiddenMember->id,
        $hiddenMemberSlug
    );

    $customer = new TeamCustomer;
    $customer->save([
        'team_id' => $team->id,
        'user_id' => (int) $hiddenUser->id,
        'is_blocked' => 0,
    ]);
    $customerSlug = "chat-customer-{$suffix}";
    $customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, $customerSlug);
    app(EntityProfile::class)->update(
        (int) $team->id,
        (int) $customerEntity->id,
        ['name' => 'Chat Customer']
    );
    $identityFixtureCount = Entity::whereIn('slug', [$memberSlug, $customerSlug])->count();
    if ($identityFixtureCount !== 2) {
        throw new RuntimeException("member/customer identity count is {$identityFixtureCount}");
    }

    $identitySessions = app(IdentitySession::class);
    $memberToken = $identitySessions->receive((int) $member->user_id, 'chat-test-device', $memberSlug);
    $decodedMemberToken = app(\app\service\Jwt::class)->parseToken($memberToken['token']);
    $assertSame('teamMember', $decodedMemberToken->act->type ?? null, 'member identity JWT carries the entity type');
    $identitySessions->session((int) $member->user_id, 'chat-test-device', (string) $decodedMemberToken->jti, 'teamMember', (int) $member->id);
    $identitySessions->drop((int) $member->user_id, 'chat-test-device', (string) $decodedMemberToken->jti);
    $assertThrows(
        fn () => $identitySessions->session((int) $member->user_id, 'chat-test-device', (string) $decodedMemberToken->jti, 'teamMember', (int) $member->id),
        401,
        'dropping an identity immediately revokes its previous token session'
    );

    $role = new TeamRole;
    $role->save([
        'team_id' => $team->id,
        'role_key' => "chat-test-{$suffix}",
        'name' => 'Chat Test Role',
        'sort' => 0,
    ]);
    $entityRole = new TeamEntityRole;
    $entityRole->save([
        'team_id' => $team->id,
        'entity_id' => $memberEntity->id,
        'role_id' => $role->id,
    ]);

    $gate = app(PermissionGate::class);
    $assert(
        !$gate->allows((int) $team->id, (int) $member->id, ['chat.conversation.create']),
        'team creator does not bypass role permissions'
    );
    $assert(
        !$gate->allows((int) $team->id, ['type' => 'team', 'id' => (int) $team->id], ['chat.conversation.create']),
        'team entity has no inherited member role'
    );

    $permissions = app(RolePermission::class);
    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.group.manage',
        'identity.team.assume',
    ]);
    $secondaryRole = new TeamRole;
    $secondaryRole->save([
        'team_id' => $team->id,
        'role_key' => "member-manager-{$suffix}",
        'name' => 'Member Manager',
        'sort' => 10,
    ]);
    $secondaryEntityRole = new TeamEntityRole;
    $secondaryEntityRole->save([
        'team_id' => $team->id,
        'entity_id' => $memberEntity->id,
        'role_id' => $secondaryRole->id,
    ]);
    $permissions->save((int) $team->id, (int) $secondaryRole->id, [
        'chat.conversation.create',
        'team.member.update',
        'team.member.remove',
        'team.entity.field.manage',
        'team.role.read',
        "identity.member.{$memberSlug}.assume",
    ]);
    $roleSummary = app(\app\service\EntityRole::class)->summary((int) $team->id, $memberSlug);
    $effectiveKeys = array_column($roleSummary['effective_permissions'], 'key');
    $assertSame(
        2,
        count(array_filter($effectiveKeys, static fn (string $key): bool => $key === 'chat.conversation.create')),
        'member permission summary displays every active role permission row'
    );
    $assert(
        count($roleSummary['role_assignments']) === 2
            && !empty($roleSummary['role_assignments'][0]['role']['permissions']),
        'member role summary includes assigned roles and each role permission list'
    );
    $memberCapabilities = app(\app\service\TeamMember::class)->capabilities(
        (int) $team->id,
        ['type' => 'teamMember', 'id' => (int) $member->id],
        ['slug' => $memberSlug]
    );
    $assert(
        $memberCapabilities['member_edit']
            && $memberCapabilities['field_manage']
            && $memberCapabilities['role_read']
            && !$memberCapabilities['role_write']
            && $memberCapabilities['member_block']
            && $memberCapabilities['member_search']
            && $memberCapabilities['member_slug']
            && $memberCapabilities['member_remove']
            && $memberCapabilities['identity_assume'],
        'member capability response matches the permissions enforced by write endpoints'
    );

    $parentRole = new TeamRole;
    $parentRole->save([
        'team_id' => $team->id,
        'role_key' => "ability-parent-{$suffix}",
        'name' => 'Ability Parent Role',
        'sort' => 20,
    ]);
    $parentEntityRole = new TeamEntityRole;
    $parentEntityRole->save([
        'team_id' => $team->id,
        'entity_id' => $memberEntity->id,
        'role_id' => $parentRole->id,
    ]);
    $dynamicMemberParent = "identity.member.{$memberSlug}";
    $permissions->save((int) $team->id, (int) $parentRole->id, [
        'team.ability',
        PermissionDictionary::TEAM_ABILITY_REDEEM,
        PermissionDictionary::IDENTITY_MEMBER_ALL_ASSUME,
        $dynamicMemberParent,
        "{$dynamicMemberParent}.assume",
    ]);
    $assertSame(
        [
            'team.ability',
            PermissionDictionary::TEAM_ABILITY_REDEEM,
            PermissionDictionary::IDENTITY_MEMBER_ALL_ASSUME,
            $dynamicMemberParent,
            "{$dynamicMemberParent}.assume",
        ],
        array_column($permissions->list((int) $team->id, (int) $parentRole->id), 'permission_key'),
        'role permission save preserves distinct parent and descendant grants for compatibility'
    );
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, [PermissionDictionary::TEAM_ABILITY_REDEEM]),
        'a parent role permission satisfies its child permission'
    );
    $assert(
        !$gate->allows((int) $team->id, (int) $member->id, ['team.notice.read']),
        'a parent role permission does not match a sibling permission'
    );
    $parentSummary = app(\app\service\EntityRole::class)->summary((int) $team->id, $memberSlug);
    $parentEffective = array_values(array_filter(
        $parentSummary['effective_permissions'],
        static fn (array $item): bool => $item['key'] === 'team.ability'
    ));
    $assert(
        count($parentEffective) === 1
            && $parentEffective[0]['label'] === '覆盖 team.ability 下全部权限'
            && $parentEffective[0]['group'] === '文件与设置',
        'member permission summary keeps parent scopes in their business group'
    );
    $dynamicParentEffective = array_values(array_filter(
        $parentSummary['effective_permissions'],
        static fn (array $item): bool => $item['key'] === $dynamicMemberParent
    ));
    $assert(
        count($dynamicParentEffective) === 1
            && $dynamicParentEffective[0]['label'] === "覆盖 {$dynamicMemberParent} 下全部权限"
            && $dynamicParentEffective[0]['group'] === '实体委托',
        'member permission summary keeps exact dynamic parent scopes in entity delegation'
    );
    $assertSame(
        2,
        count(array_filter(
            $parentSummary['effective_permissions'],
            static fn (array $item): bool => $item['key'] === "{$dynamicMemberParent}.assume"
        )),
        'member permission summary keeps duplicate and redundant child rows already present in storage'
    );
    $assert(
        count(array_filter(
            $parentSummary['effective_permissions'],
            static fn (array $item): bool => $item['key'] === "{$dynamicMemberParent}.assume"
                && $item['group'] === '实体委托'
        )) === 2,
        'member permission summary groups every exact delegation row as entity delegation'
    );

    $teamRoot = $identitySessions->receive(
        (int) $member->user_id,
        'chat-team-device',
        $memberSlug
    );
    $decodedTeamRoot = app(\app\service\Jwt::class)->parseToken($teamRoot['token']);
    $teamRootSession = $identitySessions->session(
        (int) $member->user_id,
        'chat-team-device',
        (string) $decodedTeamRoot->jti,
        'teamMember',
        (int) $member->id
    );
    $teamToken = $identitySessions->receive(
        (int) $member->user_id,
        'chat-team-device',
        (string) $team->slug,
        $teamRootSession
    );
    $decodedTeamToken = app(\app\service\Jwt::class)->parseToken($teamToken['token']);
    $assertSame('team', $decodedTeamToken->act->type ?? null, 'team identity requires and receives an entity JWT');
    $teamRole = new TeamEntityRole;
    $teamRole->save([
        'team_id' => $team->id,
        'entity_id' => $teamEntity->id,
        'role_id' => $role->id,
    ]);
    $assert(
        $gate->allows((int) $team->id, ['type' => 'team', 'id' => (int) $team->id], ['chat.conversation.create']),
        'team entity receives only its explicitly assigned role'
    );

    $virtualSlug = "chat-virtual-{$suffix}";
    $virtualCreated = app(ChatVirtual::class)->create((int) $team->id, [
        'slug' => $virtualSlug,
        'name' => 'Chat Virtual',
    ]);
    $virtualCandidates = [
        "chat.virtual.{$virtualSlug}.act",
        'chat.virtual.*.act',
    ];
    $virtualIdentity = Entity::where('slug', $virtualSlug)->find();
    $virtualModel = $virtualIdentity
        ? TeamVirtual::where('team_id', $team->id)->find($virtualIdentity->entityable_id)
        : null;
    if (!$virtualIdentity || !$virtualModel) {
        throw new RuntimeException(
            'created virtual entity or identity cannot be resolved'
                . '; identity=' . ($virtualIdentity ? 'yes' : 'no')
                . '; virtual=' . ($virtualModel ? 'yes' : 'no')
                . '; virtual_count=' . TeamVirtual::where('team_id', $team->id)->count()
                . '; identity_count=' . Entity::where('slug', $virtualSlug)->count()
                . '; identity_with_trashed=' . Entity::withTrashed()
                    ->where('slug', $virtualSlug)->count()
                . '; virtual_identity_total=' . Entity::withTrashed()
                    ->where('entityable_type', 'teamVirtual')->count()
                . '; returned_slug=' . json_encode($virtualCreated['slug'] ?? null)
        );
    }
    $virtualCatalog = $permissions->catalog((int) $team->id);
    $virtualGroupNames = array_column($virtualCatalog['groups'], 'name');
    $assertSame(1, count(array_filter($virtualGroupNames, static fn (string $name): bool => $name === '实体委托')), 'permission catalog exposes one entity delegation group');
    $assert(!in_array('身份委托', $virtualGroupNames, true) && !in_array('指定虚拟实体', $virtualGroupNames, true), 'permission catalog removes legacy delegation groups');
    $virtualItems = [];
    foreach ($virtualCatalog['groups'] as $group) {
        if (in_array($group['name'], ['实体管理', '实体委托', '聊天'], true)) {
            $virtualItems += array_column($group['items'], null, 'key');
        }
    }
    foreach ([
        "team.entity.virtual.{$virtualSlug}.manage" => '管理 · Chat Virtual',
        "chat.virtual.{$virtualSlug}.act" => '代表 · Chat Virtual 参与聊天',
        "team.entity.virtual.{$virtualSlug}.field.manage" => '管理字段 · Chat Virtual',
        "identity.virtual.{$virtualSlug}.assume" => '领取 · Chat Virtual 身份',
    ] as $key => $label) {
        $assert(
            isset($virtualItems[$key])
                && $virtualItems[$key]['label'] === $label
                && $virtualItems[$key]['resource_slug'] === $virtualSlug,
            "permission catalog uses the canonical entity slug for {$key}"
        );
    }
    $chatGroup = array_values(array_filter(
        $virtualCatalog['groups'],
        static fn (array $group): bool => $group['name'] === '聊天'
    ));
    $assert(
        count($chatGroup) === 1
            && in_array(
                "chat.virtual.{$virtualSlug}.act",
                array_column($chatGroup[0]['items'], 'key'),
                true
            ),
        'permission catalog groups virtual act permissions under chat'
    );
    $virtualAdvanced = array_column(
        $virtualCatalog['advanced_items'],
        null,
        'key'
    );
    $assert(
        isset($virtualAdvanced["team.entity.virtual.{$virtualSlug}"])
            && in_array(
                "team.entity.virtual.{$virtualSlug}.manage",
                $virtualAdvanced["team.entity.virtual.{$virtualSlug}"]['covered_keys'],
                true
            ),
        'permission catalog exposes parent scopes for current team dynamic virtual permissions'
    );
    $foreignVirtualSlug = "chat-foreign-virtual-{$suffix}";
    app(ChatVirtual::class)->create((int) $foreignTeam->id, [
        'slug' => $foreignVirtualSlug,
        'name' => 'Foreign Chat Virtual',
    ]);
    $assertThrows(
        fn () => $permissions->save(
            (int) $team->id,
            (int) $role->id,
            ["team.entity.virtual.{$foreignVirtualSlug}"]
        ),
        422,
        'dynamic parent permission for another team virtual is rejected'
    );

    $belongs = new TeamBelongs;
    $belongsRequest = static function (int $teamId, string $type, int $id): Request {
        $request = new Request;
        $request->authenticated_user_id = 910001;
        $request->team_id = $teamId;
        $request->acting_entity = ['type' => $type, 'id' => $id];
        return $request;
    };
    $belongsNext = static fn (Request $request): bool => true;
    foreach ([
        'team' => (int) $team->id,
        'teamMember' => (int) $member->id,
        'teamCustomer' => (int) $customer->id,
        'teamVirtual' => (int) $virtualModel->id,
    ] as $type => $id) {
        $assert(
            $belongs->handle($belongsRequest((int) $team->id, $type, $id), $belongsNext),
            "{$type} belongs to its current team"
        );
        $assertThrows(
            fn () => $belongs->handle(
                $belongsRequest((int) $foreignTeam->id, $type, $id),
                $belongsNext
            ),
            403,
            "{$type} cannot cross team boundaries"
        );
    }
    $assertThrows(
        fn () => $belongs->handle(
            $belongsRequest((int) $team->id, 'teamMember', 999999999),
            $belongsNext
        ),
        403,
        'missing entity does not belong to the team'
    );
    $deletedMember = new TeamMember;
    $deletedMember->save([
        'team_id' => $team->id,
        'user_id' => (int) $foreignUser->id,
        'status' => TeamMemberStatus::Active,
    ]);
    $deletedMemberId = (int) $deletedMember->id;
    $deletedMember->delete();
    $assertThrows(
        fn () => $belongs->handle(
            $belongsRequest((int) $team->id, 'teamMember', $deletedMemberId),
            $belongsNext
        ),
        403,
        'soft-deleted entity does not belong to the team'
    );

    $assert(
        !$gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'virtual access is denied when neither permission exists'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        "chat.virtual.{$virtualSlug}.act",
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'specific virtual permission grants access'
    );
    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        "identity.virtual.{$virtualSlug}.assume",
    ]);
    $virtualRoot = $identitySessions->receive(
        (int) $member->user_id,
        'chat-virtual-device',
        $memberSlug
    );
    $decodedVirtualRoot = app(\app\service\Jwt::class)->parseToken($virtualRoot['token']);
    $virtualRootSession = $identitySessions->session(
        (int) $member->user_id,
        'chat-virtual-device',
        (string) $decodedVirtualRoot->jti,
        'teamMember',
        (int) $member->id
    );
    $virtualToken = $identitySessions->receive(
        (int) $member->user_id,
        'chat-virtual-device',
        $virtualSlug,
        $virtualRootSession
    );
    $decodedVirtualToken = app(\app\service\Jwt::class)->parseToken($virtualToken['token']);
    $assertSame('teamVirtual', $decodedVirtualToken->act->type ?? null, 'specific virtual identity permission grants an entity JWT');
    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
    ]);
    $assertThrows(
        fn () => $identitySessions->session((int) $member->user_id, 'chat-virtual-device', (string) $decodedVirtualToken->jti, 'teamVirtual', (int) $virtualModel->id),
        401,
        'removing an identity permission immediately invalidates the entity token'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.virtual.*.act',
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'wildcard virtual permission grants access'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.virtual.*.act',
        "chat.virtual.{$virtualSlug}.act",
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'wildcard and specific permissions are additive'
    );

    $newVirtualSlug = "chat-new-{$suffix}";
    app(ChatVirtual::class)->create((int) $team->id, [
        'slug' => $newVirtualSlug,
        'name' => 'New Chat Virtual',
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, [
            "chat.virtual.{$newVirtualSlug}.act",
            'chat.virtual.*.act',
        ]),
        'new virtual entity inherits existing wildcard permission'
    );

    $assertThrows(
        fn () => app(ChatActor::class)->resolve((int) $foreignTeam->id, $virtualSlug),
        404,
        'virtual slug cannot be forged across teams'
    );
    $assertThrows(
        fn () => app(\app\service\ChatIntegration::class)
            ->endpointResolution('https://127.0.0.1/webhook'),
        422,
        'webhook endpoint cannot target a private or reserved address'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ['chat.virtual.foo*.act']),
        422,
        'partial wildcard permission is rejected'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ['chat.virtual.{slug}.act']),
        422,
        'permission templates cannot be persisted'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ['chat.virtual.missing.act']),
        422,
        'permission for a missing team virtual is rejected'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ["chat.virtual.{$virtualSlug}.operate"]),
        422,
        'legacy virtual permission keys are rejected instead of treated as aliases'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ["identity.virtual.{$virtualSlug}.act"]),
        422,
        'identity virtual act keys are rejected instead of treated as aliases'
    );

    $entityFields = app(\app\service\TeamEntityField::class);
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "chat_note_{$suffix}",
        'name' => 'Chat Note',
        'value_type' => 'string',
        'input_type' => 'text',
        'options' => null,
        'is_required' => 0,
        'is_editable' => 1,
        'is_searchable' => 0,
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Team->value,
        'sort' => 0,
    ]);
    $selectFieldKey = "chat_select_{$suffix}";
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => $selectFieldKey,
        'name' => 'Chat Select',
        'value_type' => 'select',
        'input_type' => 'select',
        'options' => ['alpha', 'beta'],
        'is_required' => 1,
        'is_editable' => 1,
        'is_searchable' => 0,
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Team->value,
        'sort' => 0,
    ]);
    $selectField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', $selectFieldKey)->find();
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "self_note_{$suffix}",
        'name' => 'Self Note',
        'value_type' => 'string',
        'input_type' => 'text',
        'options' => null,
        'is_required' => 0,
        'is_editable' => 1,
        'is_searchable' => 0,
        'manager_scope' => \app\enum\ManageScope::SubjectTeam->value,
        'visibility' => \app\enum\Visibility::SubjectTeam->value,
        'sort' => 0,
    ]);
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "self_hidden_{$suffix}",
        'name' => 'Self Hidden',
        'value_type' => 'string',
        'input_type' => 'text',
        'options' => null,
        'is_required' => 0,
        'is_editable' => 1,
        'is_searchable' => 0,
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Team->value,
        'sort' => 0,
    ]);
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "self_readonly_{$suffix}",
        'name' => 'Self Readonly',
        'value_type' => 'string',
        'input_type' => 'text',
        'options' => null,
        'is_required' => 0,
        'is_editable' => 0,
        'is_searchable' => 0,
        'manager_scope' => \app\enum\ManageScope::SubjectTeam->value,
        'visibility' => \app\enum\Visibility::SubjectTeam->value,
        'sort' => 0,
    ]);
    $entityFields->create((int) $team->id, [
        'entity_type' => 'customer',
        'field_key' => "self_customer_{$suffix}",
        'name' => 'Customer Only',
        'value_type' => 'string',
        'input_type' => 'text',
        'options' => null,
        'is_required' => 0,
        'is_editable' => 1,
        'is_searchable' => 0,
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Team->value,
        'sort' => 0,
    ]);
    $selfNoteField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "self_note_{$suffix}")->find();
    $selfHiddenField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "self_hidden_{$suffix}")->find();
    $selfReadonlyField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "self_readonly_{$suffix}")->find();
    $customerOnlyField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "self_customer_{$suffix}")->find();
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "team_visible_{$suffix}",
        'name' => 'Team Visible',
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Entity->value,
        'is_editable' => 1,
    ]);
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "public_visible_{$suffix}",
        'name' => 'Public Visible',
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Public->value,
        'is_editable' => 1,
    ]);
    $customFieldKey = "custom_visible_{$suffix}";
    $assertThrows(
        fn () => $entityFields->create((int) $team->id, [
            'entity_type' => 'entity',
            'field_key' => "foreign_custom_{$suffix}",
            'name' => 'Foreign Custom',
            'visibility' => \app\enum\Visibility::Custom->value,
            'visibility_targets' => [['entity_id' => (int) $foreignTeamEntity->id]],
        ]),
        422,
        'custom field visibility rejects targets from another team'
    );
    $entityFields->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => $customFieldKey,
        'name' => 'Custom Visible',
        'manager_scope' => \app\enum\ManageScope::Team->value,
        'visibility' => \app\enum\Visibility::Custom->value,
        'visibility_targets' => [['entity_id' => (int) $customerEntity->id]],
        'is_editable' => 1,
    ]);
    $customField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', $customFieldKey)->find();
    $memberActingForFields = [
        'entity_id' => (int) $memberEntity->id,
        'type' => 'teamMember',
        'id' => (int) $member->id,
    ];
    $customerActingForFields = [
        'entity_id' => (int) $customerEntity->id,
        'type' => 'teamCustomer',
        'id' => (int) $customer->id,
    ];
    $fieldKeys = static fn (array $fields): array => array_column($fields, 'field_key');
    $selfVisibleFields = $entityFields->visibleFields(
        (int) $team->id,
        'entity',
        (int) $memberEntity->id,
        $memberActingForFields
    );
    $selfVisibleKeys = $fieldKeys($selfVisibleFields);
    $assert(
        in_array("self_note_{$suffix}", $selfVisibleKeys, true)
            && in_array("self_readonly_{$suffix}", $selfVisibleKeys, true)
            && in_array("team_visible_{$suffix}", $selfVisibleKeys, true)
            && in_array("public_visible_{$suffix}", $selfVisibleKeys, true)
            && !in_array("self_hidden_{$suffix}", $selfVisibleKeys, true)
            && !in_array($customFieldKey, $selfVisibleKeys, true),
        'subject visibility includes subject, team entity and public fields without manager-only or untargeted custom fields'
    );
    $selfFieldMap = [];
    foreach ($selfVisibleFields as $field) {
        $selfFieldMap[$field['field_key']] = $field;
    }
    $assert(
        ($selfFieldMap["self_note_{$suffix}"]['can_edit'] ?? false) === true
            && ($selfFieldMap["self_readonly_{$suffix}"]['can_edit'] ?? true) === false,
        'self edit capability combines management scope and editable state'
    );
    $targetVisibleKeys = $fieldKeys($entityFields->visibleFields(
        (int) $team->id,
        'entity',
        (int) $memberEntity->id,
        $customerActingForFields
    ));
    $assert(
        in_array("team_visible_{$suffix}", $targetVisibleKeys, true)
            && in_array("public_visible_{$suffix}", $targetVisibleKeys, true)
            && in_array($customFieldKey, $targetVisibleKeys, true)
            && !in_array("self_note_{$suffix}", $targetVisibleKeys, true),
        'team entity and targeted custom visibility do not expose subject-only fields'
    );
    $anonymousVisibleKeys = $fieldKeys($entityFields->visibleFields(
        (int) $team->id,
        'entity',
        (int) $memberEntity->id,
        []
    ));
    $assertSame(
        ["public_visible_{$suffix}"],
        array_values(array_filter(
            $anonymousVisibleKeys,
            static fn (string $key): bool => str_ends_with($key, "_visible_{$suffix}")
        )),
        'anonymous field visibility only includes public fields'
    );
    $managerVisibleKeys = $fieldKeys($entityFields->visibleFields(
        (int) $team->id,
        'entity',
        (int) $memberEntity->id,
        $memberActingForFields,
        true
    ));
    $assert(
        in_array("self_hidden_{$suffix}", $managerVisibleKeys, true)
            && in_array($customFieldKey, $managerVisibleKeys, true),
        'field managers can view every field definition and value'
    );
    $customDetail = $entityFields->get((int) $team->id, (int) $customField->id);
    $assertSame(
        (int) $customerEntity->id,
        (int) ($customDetail['visibility_targets'][0]['entity_id'] ?? 0),
        'custom visibility targets round-trip through field detail'
    );
    $entityFields->update((int) $team->id, (int) $customField->id, [
        'visibility' => \app\enum\Visibility::Entity->value,
        'visibility_targets' => [],
    ]);
    $assertSame(
        0,
        \app\model\VisibilityTarget::where('visibleable_type', 'entityField')
            ->where('visibleable_id', (int) $customField->id)
            ->count(),
        'switching away from custom visibility clears targets'
    );
    $entityFields->update((int) $team->id, (int) $customField->id, [
        'visibility' => \app\enum\Visibility::Custom->value,
        'visibility_targets' => [['entity_id' => (int) $customerEntity->id]],
    ]);
    $entityFields->saveOwnValues((int) $team->id, $memberSlug, []);
    $entityFields->saveOwnValues((int) $team->id, $memberSlug, [(int) $selfNoteField->id => 'self value']);
    $assertThrows(
        fn () => $entityFields->saveOwnValues((int) $team->id, $memberSlug, [
            (int) $selfNoteField->id => 'partial update',
            (int) $selfHiddenField->id => 'hidden value',
        ]),
        403,
        'member cannot inject a hidden entity field and writes remain atomic'
    );
    $assertSame(
        'self value',
        \app\model\TeamEntityFieldValue::where('field_id', $selfNoteField->id)
            ->where('entity_id', $memberEntity->id)->value('value_string'),
        'rejected self field batch does not partially update stored values'
    );
    $assertThrows(
        fn () => $entityFields->saveOwnValues((int) $team->id, $memberSlug, [(int) $selfReadonlyField->id => 'readonly value']),
        403,
        'member cannot write a visible readonly entity field'
    );
    $assertThrows(
        fn () => $entityFields->saveOwnValues((int) $team->id, $memberSlug, [(int) $customerOnlyField->id => 'wrong type']),
        422,
        'member cannot write a different entity type field'
    );
    $assertThrows(
        fn () => $entityFields->saveValues((int) $team->id, $memberSlug, []),
        422,
        'omitted required entity field is rejected when no stored value exists'
    );
    $entityFields->saveValues(
        (int) $team->id,
        $memberSlug,
        [(int) $selectField->id => 'alpha']
    );
    $assertSame(
        1,
        \app\model\TeamEntityFieldValue::where('field_id', $selectField->id)
            ->where('entity_id', $memberEntity->id)
            ->count(),
        'unified entity field stores member value'
    );
    $assertThrows(
        fn () => $entityFields->saveValues(
            (int) $team->id,
            $memberSlug,
            [(int) $selectField->id => 'outside-option']
        ),
        422,
        'entity select value outside configured options is rejected'
    );
    $publicVisibleField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "public_visible_{$suffix}")->find();
    $entityFields->saveValues((int) $team->id, $memberSlug, [
        (int) $selfHiddenField->id => 'manager secret',
        (int) $publicVisibleField->id => 'public value',
        (int) $customField->id => 'targeted value',
    ]);
    $memberRead = app(\app\service\TeamMember::class)->get(
        (int) $team->id,
        (int) $member->id,
        $customerActingForFields
    );
    $memberReadFieldKeys = array_map(
        static fn (array $value): string => (string) ($value['field']['field_key'] ?? ''),
        $memberRead['fieldValues']
    );
    $assert(
        !in_array("self_hidden_{$suffix}", $memberReadFieldKeys, true),
        'member detail relation filters manager-only values'
    );
    $assert(
        in_array("public_visible_{$suffix}", $memberReadFieldKeys, true),
        'member detail relation preserves public values'
    );
    $assert(
        in_array($customFieldKey, $memberReadFieldKeys, true),
        'member detail relation preserves targeted values'
    );
    $memberList = app(\app\service\TeamMember::class)->list(
        (int) $team->id,
        $customerActingForFields
    );
    $listedMember = array_values(array_filter(
        $memberList,
        static fn (array $item): bool => (int) $item['id'] === (int) $member->id
    ))[0] ?? null;
    $assert(is_array($listedMember), 'member list includes the tested member');
    $memberListFieldKeys = array_map(
        static fn (array $value): string => (string) ($value['field']['field_key'] ?? ''),
        $listedMember['fieldValues']
    );
    $assert(
        !in_array("self_hidden_{$suffix}", $memberListFieldKeys, true),
        'member list relation filters manager-only values'
    );
    $assert(
        in_array("public_visible_{$suffix}", $memberListFieldKeys, true),
        'member list relation preserves public values'
    );
    $assert(
        in_array($customFieldKey, $memberListFieldKeys, true),
        'member list relation preserves targeted values'
    );
    $entityFields->delete((int) $team->id, (int) $customField->id);
    $assertSame(
        0,
        \app\model\VisibilityTarget::where('visibleable_type', 'entityField')
            ->where('visibleable_id', (int) $customField->id)
            ->count(),
        'deleting an entity field removes custom visibility targets'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.virtual.*.act',
        "chat.virtual.{$virtualSlug}.act",
    ]);
    app(ChatVirtual::class)->delete((int) $team->id, $virtualSlug);
    $assertSame(
        0,
        TeamRolePermission::where('team_id', $team->id)
            ->where('permission_key', "chat.virtual.{$virtualSlug}.act")->count(),
        'deleting virtual entity removes its specific permission'
    );
    $assertSame(
        1,
        TeamRolePermission::where('team_id', $team->id)
            ->where('permission_key', 'chat.virtual.*.act')->count(),
        'deleting virtual entity preserves wildcard permission'
    );
    $assert(
        Entity::withTrashed()->where('slug', $virtualSlug)->find() !== null,
        'deleted virtual slug remains permanently reserved'
    );
    $assert(
        TeamVirtual::where('team_id', $team->id)
            ->where('id', (int) $virtualIdentity->entityable_id)->find() === null,
        'deleted virtual entity is hidden by soft delete'
    );
    $assertThrows(
        fn () => app(ChatVirtual::class)->create((int) $team->id, [
            'slug' => $virtualSlug,
            'name' => 'Reused Chat Virtual',
        ]),
        409,
        'deleted virtual slug cannot be reused'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.group.manage',
        'chat.virtual.*.act',
    ]);
    $conversations = app(ChatConversation::class);
    $memberActing = ['entity_id' => (int) $memberEntity->id, 'type' => 'teamMember', 'id' => (int) $member->id];
    $customerActing = ['entity_id' => (int) $customerEntity->id, 'type' => 'teamCustomer', 'id' => (int) $customer->id];
    $created = $conversations->create((int) $team->id, $memberActing, [
        'kind' => 'direct',
        'actor_slug' => $memberSlug,
        'participants' => [$customerSlug],
        'is_temporary' => 0,
    ]);
    $assertSame(false, $created['existing'], 'first ordinary direct conversation is created');
    $existing = $conversations->create((int) $team->id, $customerActing, [
        'kind' => 'direct',
        'actor_slug' => $customerSlug,
        'participants' => [$memberSlug],
        'is_temporary' => 0,
    ]);
    $assertSame(true, $existing['existing'], 'ordinary direct conversation is unique by unordered participants');
    $assertSame($created['uuid'], $existing['uuid'], 'reversed direct participants resolve to the same conversation');

    $temporary = $conversations->create((int) $team->id, $memberActing, [
        'kind' => 'direct',
        'actor_slug' => $memberSlug,
        'participants' => [$customerSlug],
        'is_temporary' => 1,
        'expires_at' => time() + 3600,
    ]);
    $assert(
        $temporary['uuid'] !== $created['uuid'],
        'temporary direct conversations may coexist with ordinary direct conversation'
    );

    $messages = app(ChatMessageService::class);
    $assertThrows(
        fn () => $messages->send((int) $team->id, $memberActing, [
            'conversation' => $created['uuid'],
            'actor_slug' => $memberSlug,
            'content' => '   ',
        ]),
        422,
        'whitespace-only chat message is rejected'
    );
    $sent = $messages->send((int) $team->id, $memberActing, [
        'conversation' => $created['uuid'],
        'actor_slug' => $memberSlug,
        'content' => 'hello',
    ]);
    $assertSame('hello', $sent['content'], 'member sends a text message');
    $storedMessage = ChatMessage::find((int) $sent['id']);
    if (!$storedMessage || (int) $storedMessage->getData('create_time') < time() - 60) {
        throw new RuntimeException(
            'message timestamp is invalid: ' . json_encode($storedMessage?->getData('create_time'))
        );
    }
    $messages->edit((int) $team->id, $memberActing, (int) $sent['id'], 'edited');
    $assertSame(
        'edited',
        ChatMessage::find((int) $sent['id'])?->content,
        'sender edits message inside the configured window'
    );
    $messages->read(
        (int) $team->id,
        $created['uuid'],
        $memberSlug,
        $memberActing,
        (int) $sent['id']
    );
    $listed = $messages->list(
        (int) $team->id,
        $created['uuid'],
        $memberActing
    );
    $assertSame(1, count($listed), 'conversation message list returns the sent message');

    $secondMessage = $messages->send((int) $team->id, $memberActing, [
        'conversation' => $created['uuid'],
        'actor_slug' => $memberSlug,
        'content' => 'read receipt disabled',
    ]);
    app(\app\service\TeamSetting::class)->batch((int) $team->id, 'chat', [
        'read_receipts' => false,
    ]);
    $messages->read(
        (int) $team->id,
        $created['uuid'],
        $memberSlug,
        $memberActing,
        (int) $secondMessage['id']
    );
    $conversationId = (int) \app\model\ChatConversation::where('uuid', $created['uuid'])->value('id');
    $memberParticipant = \app\model\ChatParticipant::where('conversation_id', $conversationId)
        ->where('entity_id', $memberEntity->id)->find();
    $assertSame(
        (int) $sent['id'],
        (int) $memberParticipant->last_read_message_id,
        'disabled read receipts do not advance the stored cursor'
    );
    $conversationWithoutReceipts = $conversations->get(
        (int) $team->id,
        $created['uuid'],
        $memberActing
    );
    $assert(
        array_reduce(
            $conversationWithoutReceipts['participants'],
            static fn (bool $carry, array $participant): bool =>
                $carry && $participant['last_read_message_id'] === null,
            true
        ),
        'disabled read receipts are hidden from conversation responses'
    );

    $messages->revoke((int) $team->id, $memberActing, (int) $sent['id']);
    $assert(
        ChatMessage::find((int) $sent['id'])?->revoked_at !== null,
        'sender can revoke message inside the configured window'
    );

    $hiddenDirect = $conversations->create((int) $team->id, $customerActing, [
        'kind' => 'direct',
        'actor_slug' => $customerSlug,
        'participants' => [$hiddenMemberSlug],
        'is_temporary' => 0,
    ]);
    $assert(
        trim((string) ($hiddenDirect['uuid'] ?? '')) !== '',
        'display visibility does not affect chat availability'
    );

    $assertThrows(
        fn () => $conversations->create((int) $team->id, $customerActing, [
            'kind' => 'group',
            'actor_slug' => $customerSlug,
            'participants' => [$memberSlug],
            'is_temporary' => 0,
        ]),
        403,
        'customer cannot create a group in invite-only mode'
    );

    $claimEvents = new ReflectionMethod(\app\service\ChatOutbox::class, 'claimEvents');
    $firstToken = bin2hex(random_bytes(16));
    $firstClaim = $claimEvents->invoke(
        app(\app\service\ChatOutbox::class),
        1,
        $firstToken
    );
    $secondClaim = $claimEvents->invoke(
        app(\app\service\ChatOutbox::class),
        100,
        bin2hex(random_bytes(16))
    );
    $firstIds = array_map('intval', $firstClaim->column('id'));
    $secondIds = array_map('intval', $secondClaim->column('id'));
    $assert(
        $firstIds !== [] && array_intersect($firstIds, $secondIds) === [],
        'outbox lease claims do not overlap across workers'
    );
    $replacementToken = bin2hex(random_bytes(16));
    ChatEventOutbox::where('id', $firstIds[0])->update([
        'processing_token' => $replacementToken,
        'processing_until' => time() + 600,
    ]);
    $updateClaimedEvent = new ReflectionMethod(\app\service\ChatOutbox::class, 'updateClaimedEvent');
    $assert(
        $updateClaimedEvent->invoke(
            app(\app\service\ChatOutbox::class),
            $firstClaim->first(),
            $firstToken,
            ['published_at' => time()]
        ) === false,
        'worker that lost its lease cannot confirm an outbox event'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Chat backend tests passed." . PHP_EOL);
