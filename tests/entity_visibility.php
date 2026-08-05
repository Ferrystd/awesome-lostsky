<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\model\Entity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\TeamVirtual;
use app\model\User;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$users = [];
$entities = [];

$assertSame = static function (mixed $expected, mixed $actual, string $case): void {
    if ($expected !== $actual) {
        throw new RuntimeException(
            "{$case}: expected " . json_encode($expected) . ', got ' . json_encode($actual)
        );
    }
};
$assertNotFound = static function (callable $callback, string $case): void {
    try {
        $callback();
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() === 404) {
            return;
        }
        throw new RuntimeException("{$case}: expected 404, got {$exception->getStatusCode()}");
    }
    throw new RuntimeException("{$case}: expected 404");
};
$assertStatus = static function (callable $callback, int $status, string $case): void {
    try {
        $callback();
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() === $status) {
            return;
        }
        throw new RuntimeException("{$case}: expected {$status}, got {$exception->getStatusCode()}");
    }
    throw new RuntimeException("{$case}: expected {$status}");
};

try {
    foreach (['owner', 'member', 'customer'] as $index => $label) {
        $user = new User;
        $user->save([
            'phone' => '16' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
            'username' => "entity-visibility-{$label}-{$suffix}",
            'password' => password_hash('test-only', PASSWORD_DEFAULT),
        ]);
        $users[$index] = $user;
    }

    $team = new Team;
    $team->save([
        'slug' => "entity-visibility-{$suffix}",
        'user_id' => (int) $users[0]->id,
    ]);
    $teamEntity = app(EntityService::class)->claimTeam($team);
    $entities[] = $teamEntity;

    $member = new TeamMember;
    $member->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $users[1]->id,
        'status' => TeamMemberStatus::Active,
    ]);
    $memberEntity = app(EntityService::class)->claimMember(
        (int) $team->id,
        (int) $member->id,
        "entity-visibility-member-{$suffix}"
    );
    $entities[] = $memberEntity;

    $virtual = new TeamVirtual;
    $virtual->save([
        'team_id' => (int) $team->id,
        'name' => 'Hidden virtual',
        'is_active' => 1,
    ]);
    $virtualEntity = app(EntityService::class)->claimVirtual(
        $virtual,
        "entity-visibility-virtual-{$suffix}"
    );
    $entities[] = $virtualEntity;

    $customer = new TeamCustomer;
    $customer->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $users[2]->id,
        'is_blocked' => 0,
    ]);
    $customerEntity = app(EntityService::class)->claimCustomer(
        (int) $customer->id,
        "entity-visibility-customer-{$suffix}"
    );
    $assertStatus(
        fn () => app(EntityService::class)->setInternalVisibility(
            (int) $team->id,
            (int) $customerEntity->id,
            1
        ),
        422,
        'Customer does not support a base-directory visibility switch'
    );
    // 模拟旧数据错误地保留为 1，验证读取边界本身仍不会泄露 Customer。
    $customerEntity->save(['is_internal_visible' => 1]);
    $entities[] = $customerEntity;

    $base = app(EntityProfile::class)->listing((int) $team->id, null, 1, 100, false);
    $assertSame(
        [(int) $teamEntity->id, (int) $memberEntity->id],
        array_map('intval', array_column($base['list'], 'id')),
        'base directory exposes only Team and internally visible non-Customer entities'
    );
    $assertNotFound(
        fn () => app(EntityProfile::class)->get(
            (int) $team->id,
            (int) $virtualEntity->id,
            false
        ),
        'hidden virtual direct access'
    );
    $assertNotFound(
        fn () => app(EntityProfile::class)->get(
            (int) $team->id,
            (int) $customerEntity->id,
            false
        ),
        'Customer direct access without team.entity.read'
    );

    $full = app(EntityProfile::class)->listing((int) $team->id, null, 1, 100, true);
    $assertSame(4, $full['total'], 'team.entity.read exposes the complete entity collection');

    $virtualEntity->save(['is_internal_visible' => 1]);
    $base = app(EntityProfile::class)->listing((int) $team->id, null, 1, 100, false);
    $assertSame(
        [(int) $teamEntity->id, (int) $memberEntity->id, (int) $virtualEntity->id],
        array_map('intval', array_column($base['list'], 'id')),
        'an internally visible Virtual enters the base directory while Customer stays excluded'
    );
} finally {
    $entityIds = array_map(static fn (Entity $entity): int => (int) $entity->id, $entities);
    if ($entityIds) {
        app()->db->name('team_entity_profile')->whereIn('entity_id', $entityIds)->delete();
        Entity::destroy($entityIds, true);
    }
    if (isset($customer)) TeamCustomer::destroy((int) $customer->id, true);
    if (isset($virtual)) TeamVirtual::destroy((int) $virtual->id, true);
    if (isset($member)) TeamMember::destroy((int) $member->id, true);
    if (isset($team)) Team::destroy((int) $team->id, true);
    if ($users) User::destroy(array_map(static fn (User $user): int => (int) $user->id, $users), true);
}

fwrite(STDOUT, "Entity visibility tests passed\n");
