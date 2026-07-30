<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\ManageScope;
use app\enum\TeamEntityType;
use app\enum\Visibility;
use app\model\Document;
use app\model\Entity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamEntityField;
use app\model\TeamEntityFieldValue;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamProduct;
use app\model\TeamRole;
use app\model\TeamVirtual;
use app\model\User;
use app\service\Display;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\Role as RoleService;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$assert = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$assertSame = static function (mixed $expected, mixed $actual, string $message): void {
    if ($expected !== $actual) {
        throw new RuntimeException(
            "{$message}: expected " . var_export($expected, true) . ', got ' . var_export($actual, true)
        );
    }
};
$assertStatus = static function (callable $callback, int $status, string $message): void {
    try {
        $callback();
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() === $status) {
            return;
        }
        throw new RuntimeException("{$message}: expected {$status}, got {$exception->getStatusCode()}");
    }
    throw new RuntimeException("{$message}: expected HttpException {$status}");
};
$user = static function (string $name) use ($suffix): User {
    $record = new User;
    $record->save([
        'phone' => '19' . random_int(100000000, 999999999),
        'username' => "{$name}-{$suffix}",
        'password' => password_hash('display-test-only', PASSWORD_DEFAULT),
    ]);
    return $record;
};
$member = static function (Team $team, User $user, string $slug) use ($suffix): array {
    $record = new TeamMember;
    $record->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $user->id,
        'is_blocked' => 0,
    ]);
    $entity = app(EntityService::class)->claimMember(
        (int) $team->id,
        (int) $record->id,
        "{$slug}-{$suffix}"
    );
    return [$record, $entity];
};
$document = static function (
    Entity $entity,
    string $title,
    Visibility $visibility,
    int $sort = 0
): Document {
    $record = new Document;
    $record->save([
        'entity_id' => (int) $entity->id,
        'title' => $title,
        'content' => "# {$title}\n\n公开正文",
        'manager_scope' => ManageScope::Team,
        'visibility' => $visibility,
        'sort' => $sort,
    ]);
    return $record;
};

$owner = $user('display-owner');
$publicUser = $user('display-public');
$hiddenUser = $user('display-hidden');
$blockedUser = $user('display-blocked');
$deletedUser = $user('display-deleted');
$customerUser = $user('display-customer');
$foreignOwner = $user('display-foreign-owner');
$cancelledOwner = $user('display-cancelled-owner');

$team = new Team;
$team->save(['slug' => "display-{$suffix}", 'user_id' => (int) $owner->id]);
$teamEntity = app(EntityService::class)->claimTeam($team);
app(EntityProfile::class)->update((int) $team->id, (int) $teamEntity->id, [
    'name' => 'Display 测试团队',
    'description' => '团队公开简介',
    'intro_image' => 'https://assets.example.test/team-portrait.png',
    'introduction_markdown' => '欢迎访问 @public',
]);

$foreignTeam = new Team;
$foreignTeam->save(['slug' => "display-foreign-{$suffix}", 'user_id' => (int) $foreignOwner->id]);
$foreignTeamEntity = app(EntityService::class)->claimTeam($foreignTeam);
app(EntityProfile::class)->update((int) $foreignTeam->id, (int) $foreignTeamEntity->id, [
    'name' => '外部团队',
]);

$cancelledTeam = new Team;
$cancelledTeam->save([
    'slug' => "display-cancelled-{$suffix}",
    'user_id' => (int) $cancelledOwner->id,
    'is_cancelled' => 1,
]);
app(EntityService::class)->claimTeam($cancelledTeam);

[$publicMember, $publicEntity] = $member($team, $publicUser, 'display-public');
[$hiddenMember, $hiddenEntity] = $member($team, $hiddenUser, 'display-hidden');
[$blockedMember, $blockedEntity] = $member($team, $blockedUser, 'display-blocked');
[$deletedMember, $deletedEntity] = $member($team, $deletedUser, 'display-deleted');
app(EntityProfile::class)->update((int) $team->id, (int) $publicEntity->id, [
    'name' => '公开成员',
    'description' => '成员公开简介',
]);
$publicRole = new TeamRole;
$publicRole->save([
    'team_id' => (int) $team->id,
    'role_key' => "public_{$suffix}",
    'name' => '公开角色',
    'description' => '可安全展示的角色说明',
    'sort' => 10,
    'is_displayed' => 1,
]);
$hiddenRole = new TeamRole;
$hiddenRole->save([
    'team_id' => (int) $team->id,
    'role_key' => "hidden_{$suffix}",
    'name' => '内部角色',
    'description' => '不可公开',
    'sort' => 1,
    'is_displayed' => 0,
]);
foreach ([$publicRole, $hiddenRole] as $role) {
    $assignment = new TeamEntityRole;
    $assignment->save([
        'team_id' => (int) $team->id,
        'entity_id' => (int) $publicEntity->id,
        'role_id' => (int) $role->id,
    ]);
}
$managedRoleId = app(RoleService::class)->create((int) $team->id, [
    'role_key' => "managed_{$suffix}",
    'name' => '后台配置角色',
    'description' => null,
    'sort' => 30,
    'is_displayed' => 1,
]);
$assertSame(1, app(RoleService::class)->get((int) $team->id, $managedRoleId)['is_displayed'], 'role can be created as public');
app(RoleService::class)->update((int) $team->id, $managedRoleId, ['is_displayed' => 0]);
$assertSame(0, app(RoleService::class)->get((int) $team->id, $managedRoleId)['is_displayed'], 'role public setting can be changed');

$virtual = new TeamVirtual;
$virtual->save([
    'team_id' => (int) $team->id,
    'name' => '公开机器人',
    'is_active' => 1,
]);
$virtualEntity = app(EntityService::class)->claimVirtual($virtual, "display-virtual-{$suffix}");
app(EntityProfile::class)->update((int) $team->id, (int) $virtualEntity->id, ['name' => '公开机器人']);

$inactiveVirtual = new TeamVirtual;
$inactiveVirtual->save([
    'team_id' => (int) $team->id,
    'name' => '停用机器人',
    'is_active' => 1,
]);
$inactiveVirtualEntity = app(EntityService::class)->claimVirtual(
    $inactiveVirtual,
    "display-inactive-{$suffix}"
);

$customer = new TeamCustomer;
$customer->save([
    'team_id' => (int) $team->id,
    'user_id' => (int) $customerUser->id,
    'is_blocked' => 0,
]);
$customerEntity = app(EntityService::class)->claimCustomer(
    (int) $customer->id,
    "display-customer-{$suffix}"
);

[$foreignMember, $foreignEntity] = $member($foreignTeam, $foreignOwner, 'display-foreign-member');

$entities = app(EntityService::class);
foreach ([$publicEntity, $blockedEntity, $deletedEntity, $virtualEntity, $inactiveVirtualEntity, $foreignEntity] as $entity) {
    $teamId = $entity === $foreignEntity ? (int) $foreignTeam->id : (int) $team->id;
    $entities->setDisplay($teamId, (int) $entity->id, 1);
}
$blockedMember->save(['is_blocked' => 1]);
$deletedMember->delete();
$inactiveVirtual->save(['is_active' => 0]);
$customerEntity->save(['is_displayed' => 1]);

$publicField = new TeamEntityField;
$publicField->save([
    'team_id' => (int) $team->id,
    'entity_type' => TeamEntityType::Entity,
    'field_key' => "public_{$suffix}",
    'name' => '公开字段',
    'source' => 'custom',
    'value_type' => 'string',
    'input_type' => 'text',
    'default_value' => null,
    'manager_scope' => ManageScope::SubjectTeam,
    'visibility' => Visibility::Public,
    'is_required' => 0,
    'is_editable' => 1,
    'is_searchable' => 1,
    'is_system' => 0,
    'sort' => 10,
]);
$privateField = new TeamEntityField;
$privateField->save([
    'team_id' => (int) $team->id,
    'entity_type' => TeamEntityType::Entity,
    'field_key' => "private_{$suffix}",
    'name' => '内部字段',
    'source' => 'custom',
    'value_type' => 'string',
    'input_type' => 'text',
    'default_value' => '不可公开',
    'manager_scope' => ManageScope::Team,
    'visibility' => Visibility::Team,
    'is_required' => 0,
    'is_editable' => 1,
    'is_searchable' => 0,
    'is_system' => 0,
    'sort' => 20,
]);
$teamFieldValue = new TeamEntityFieldValue;
$teamFieldValue->save([
    'team_id' => (int) $team->id,
    'field_id' => (int) $publicField->id,
    'entity_id' => (int) $teamEntity->id,
    'value_string' => '团队公开值',
]);
$memberFieldValue = new TeamEntityFieldValue;
$memberFieldValue->save([
    'team_id' => (int) $team->id,
    'field_id' => (int) $publicField->id,
    'entity_id' => (int) $publicEntity->id,
    'value_string' => '成员公开值',
]);
$virtualField = new TeamEntityField;
$virtualField->save([
    'team_id' => (int) $team->id,
    'entity_type' => TeamEntityType::Virtual,
    'field_key' => "virtual_{$suffix}",
    'name' => '服务状态',
    'source' => 'custom',
    'value_type' => 'bool',
    'input_type' => 'switch',
    'default_value' => '1',
    'manager_scope' => ManageScope::Team,
    'visibility' => Visibility::Public,
    'is_required' => 0,
    'is_editable' => 1,
    'is_searchable' => 0,
    'is_system' => 0,
    'sort' => 5,
]);

$teamPublicDocument = $document($teamEntity, '团队公开文档', Visibility::Public, 2);
$teamPrivateDocument = $document($teamEntity, '团队内部文档', Visibility::Team, 1);
$memberPublicDocument = $document($publicEntity, '成员公开文档', Visibility::Public);
$hiddenPublicDocument = $document($hiddenEntity, '隐藏成员文档', Visibility::Public);
$foreignPublicDocument = $document($foreignEntity, '外部成员文档', Visibility::Public);

$publicProduct = new TeamProduct;
$publicProduct->save([
    'team_id' => (int) $team->id,
    'entity_id' => (int) $publicEntity->id,
    'name' => '成员专属商品',
    'description' => '公开商品简介',
    'cover_image' => 'https://assets.example.test/member-product.png',
    'price' => '39.00',
    'cost' => '10.00',
    'handler_cut' => '8.00',
    'is_active' => 1,
]);
$inactiveProduct = new TeamProduct;
$inactiveProduct->save([
    'team_id' => (int) $team->id,
    'entity_id' => (int) $publicEntity->id,
    'name' => '已下架商品',
    'price' => '99.00',
    'cost' => '1.00',
    'is_active' => 0,
]);
$sharedProduct = new TeamProduct;
$sharedProduct->save([
    'team_id' => (int) $team->id,
    'entity_id' => null,
    'name' => '团队公用商品',
    'price' => '29.00',
    'cost' => '1.00',
    'is_active' => 1,
]);

$display = app(Display::class);
$profile = $display->profile((int) $team->id);
$assertSame('Display 测试团队', $profile['profile']['name'], 'team profile is public');
$assertSame(
    'https://assets.example.test/team-portrait.png',
    $profile['profile']['intro_image'],
    'existing intro image is exposed as the Display portrait'
);
$assertSame('团队公开值', $profile['fields'][0]['value'] ?? null, 'team public field is returned');
$assertSame(
    ['key', 'name', 'value_type', 'value'],
    array_keys($profile['fields'][0]),
    'public field response excludes internal configuration'
);

$page = $display->entities((int) $team->id, null, 0, 999);
$listedSlugs = array_column($page['list'], 'slug');
$assertSame(1, $page['page'], 'entity page is normalized');
$assertSame(100, $page['limit'], 'entity limit is capped');
$assert(in_array((string) $publicEntity->slug, $listedSlugs, true), 'displayed member is listed');
$assert(in_array((string) $virtualEntity->slug, $listedSlugs, true), 'displayed virtual entity is listed');
$listedMember = array_column($page['list'], null, 'slug')[(string) $publicEntity->slug];
$assertSame(
    [['name' => '公开角色', 'description' => '可安全展示的角色说明']],
    $listedMember['roles'],
    'only roles marked for display are included in entity summaries'
);
foreach ([$hiddenEntity, $blockedEntity, $deletedEntity, $inactiveVirtualEntity, $customerEntity, $foreignEntity] as $excluded) {
    $assert(!in_array((string) $excluded->slug, $listedSlugs, true), "{$excluded->slug} is excluded");
}
$assertSame(1, $display->entities((int) $team->id, 'teamMember', 1, 20)['total'], 'member filter works');
$assertSame(1, $display->entities((int) $team->id, 'teamVirtual', 1, 20)['total'], 'virtual filter works');
$assertStatus(
    fn () => $display->entities((int) $team->id, 'teamCustomer', 1, 20),
    422,
    'customer type cannot be queried'
);

$detail = $display->entity((int) $team->id, (string) $publicEntity->slug);
$assertSame('成员公开值', $detail['fields'][0]['value'] ?? null, 'member public value is returned');
$assertSame(
    [[
        'id' => (int) $publicProduct->id,
        'name' => '成员专属商品',
        'description' => '公开商品简介',
        'cover_image' => 'https://assets.example.test/member-product.png',
        'price' => '39.00',
        'href' => "//{$team->slug}.shop.lostsky.work/product/{$publicProduct->id}",
    ]],
    $detail['products'],
    'entity detail only exposes its active product summaries'
);
$assert(
    !array_key_exists('cost', $detail['products'][0])
        && !array_key_exists('handler_cut', $detail['products'][0]),
    'entity products exclude internal money and handler configuration'
);
$assertSame(
    ['name', 'description'],
    array_keys($detail['roles'][0]),
    'public role output excludes ids, keys, permissions and bindings'
);
$virtualDetail = $display->entity((int) $team->id, (string) $virtualEntity->slug);
$assertSame(1, $virtualDetail['fields'][0]['value'] ?? null, 'field default value is used');
foreach ([$hiddenEntity, $blockedEntity, $inactiveVirtualEntity, $customerEntity, $foreignEntity] as $unavailable) {
    $assertStatus(
        fn () => $display->entity((int) $team->id, (string) $unavailable->slug),
        404,
        "{$unavailable->slug} detail is hidden"
    );
}

$teamDocuments = $display->documents((int) $team->id, null, 1, 20);
$assertSame(1, $teamDocuments['total'], 'only public team documents are listed');
$assertSame((int) $teamPublicDocument->id, $teamDocuments['list'][0]['id'], 'team public document is listed');
$memberDocuments = $display->documents((int) $team->id, (string) $publicEntity->slug, 1, 20);
$assertSame((int) $memberPublicDocument->id, $memberDocuments['list'][0]['id'], 'member document is listed');
$assertSame(
    (int) $memberPublicDocument->getData('update_time'),
    $memberDocuments['list'][0]['update_time'],
    'document summary exposes the raw Unix timestamp'
);
$publicDocument = $display->document((int) $team->id, (int) $memberPublicDocument->id);
$assert(str_contains((string) $publicDocument['content'], '公开正文'), 'public document content is returned');
$assertSame(
    (int) $memberPublicDocument->getData('update_time'),
    $publicDocument['update_time'],
    'document detail exposes the raw Unix timestamp'
);
foreach ([
    [$teamPrivateDocument, 'private document'],
    [$hiddenPublicDocument, 'hidden entity document'],
    [$foreignPublicDocument, 'cross-team document'],
] as [$unavailableDocument, $label]) {
    $assertStatus(
        fn () => $display->document((int) $team->id, (int) $unavailableDocument->id),
        404,
        "{$label} cannot be fetched by id"
    );
}
$assertStatus(
    fn () => $display->documents((int) $team->id, (string) $hiddenEntity->slug, 1, 20),
    404,
    'hidden entity documents cannot be listed'
);

$resolved = $display->resolve([
    (string) $team->slug,
    (string) $publicEntity->slug,
    (string) $virtualEntity->slug,
    (string) $hiddenEntity->slug,
    (string) $customerEntity->slug,
    (string) $foreignEntity->slug,
]);
$resolvedBySlug = array_column($resolved, null, 'slug');
$assert($resolvedBySlug[(string) $team->slug]['available'], 'team reference resolves');
$assert($resolvedBySlug[(string) $publicEntity->slug]['available'], 'member reference resolves');
$assert(
    str_contains((string) $resolvedBySlug[(string) $foreignEntity->slug]['href'], "{$foreignTeam->slug}.display"),
    'cross-team public reference links to its public team page'
);
$assert(!$resolvedBySlug[(string) $hiddenEntity->slug]['available'], 'hidden reference is unavailable');
$assert(!$resolvedBySlug[(string) $customerEntity->slug]['available'], 'customer reference is unavailable');

$assertStatus(
    fn () => $entities->setDisplay((int) $team->id, (int) $customerEntity->id, 1),
    422,
    'customers cannot be displayed'
);
$assertStatus(
    fn () => $entities->setDisplay((int) $team->id, (int) $teamEntity->id, 1),
    422,
    'team display flag is not configurable'
);
$assertStatus(
    fn () => $entities->setDisplay((int) $team->id, (int) $foreignEntity->id, 1),
    422,
    'display setting cannot cross team boundaries'
);

$searchableBefore = (bool) TeamMember::find((int) $publicMember->id)?->is_searchable;
$entities->setDisplay((int) $team->id, (int) $publicEntity->id, 0);
$searchableAfter = (bool) TeamMember::find((int) $publicMember->id)?->is_searchable;
$assertSame($searchableBefore, $searchableAfter, 'display setting does not change search availability');
$assertStatus(
    fn () => $display->profile((int) $cancelledTeam->id),
    404,
    'cancelled team page is unavailable'
);

echo "display backend tests passed\n";
