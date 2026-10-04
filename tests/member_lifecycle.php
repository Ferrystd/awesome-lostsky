<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\model\Entity;
use app\model\Team;
use app\model\TeamEntityProfile;
use app\model\TeamMember;
use app\model\TeamMemberTenure;
use app\model\User;
use app\service\TeamJoin;
use app\service\TeamMember as TeamMemberService;
use app\service\TeamMemberDeparture;
use app\service\TeamSetting;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$throwsStatus = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = $case;
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) $failures[] = $case;
    }
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $owner = new User;
    $owner->save([
        'phone' => '13' . random_int(100000000, 999999999),
        'username' => "lifecycle-owner-{$suffix}",
        'password' => 'member-lifecycle-test',
    ]);
    $user = new User;
    $user->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'username' => "lifecycle-member-{$suffix}",
        'password' => 'member-lifecycle-test',
    ]);

    $team = new Team;
    $team->save([
        'slug' => "lifecycle-{$suffix}",
        'user_id' => (int) $owner->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    $ownerMember = new TeamMember;
    $ownerMember->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $owner->id,
        'status' => TeamMemberStatus::Active,
    ]);
    $ownerEntity = app(\app\service\Entity::class)->claimMember(
        (int) $team->id,
        (int) $ownerMember->id,
        "lifecycle-owner-{$suffix}"
    );

    $member = new TeamMember;
    $member->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $user->id,
        'status' => TeamMemberStatus::Active,
    ]);
    $entity = app(\app\service\Entity::class)->claimMember(
        (int) $team->id,
        (int) $member->id,
        "lifecycle-member-{$suffix}"
    );
    $profile = TeamEntityProfile::where('entity_id', (int) $entity->id)->findOrEmpty();
    $profile->save(['entity_id' => (int) $entity->id, 'name' => '保留资料成员', 'avatar' => '']);
    $tenure = new TeamMemberTenure;
    $tenure->save([
        'team_id' => (int) $team->id,
        'member_id' => (int) $member->id,
        'join_application_id' => null,
        'joined_at' => time() - 3600,
        'departed_at' => null,
    ]);

    $settings = app(TeamSetting::class);
    $departures = app(TeamMemberDeparture::class);
    $members = app(TeamMemberService::class);
    $join = app(TeamJoin::class);

    foreach ([[], ['nickname' => '不应写入', 'post_type_ids' => [1]]] as $legacyData) {
        $throwsStatus(
            fn () => $members->edit((int) $team->id, (int) $member->id, $legacyData),
            410,
            'retired member editing never returns a false success'
        );
    }
    $throwsStatus(
        fn () => $members->edit((int) $team->id, 0, []),
        404,
        'retired member editing still rejects a missing member'
    );
    $throwsStatus(
        fn () => $members->edit((int) $team->id + 1000000, (int) $member->id, []),
        404,
        'retired member editing still hides members outside the team'
    );
    $profiles = app(\app\service\EntityProfile::class);
    $assert((string) TeamEntityProfile::where('entity_id', $entity->id)->value('name') === '保留资料成员', 'retired editing leaves the persisted profile unchanged');
    $profiles->update((int) $team->id, (int) $entity->id, ['description' => '持久化资料']);
    $profiles->update((int) $team->id, (int) $entity->id, ['avatar' => 'avatar.png']);
    $savedProfile = TeamEntityProfile::where('entity_id', $entity->id)->find();
    $assert((string) $savedProfile->name === '保留资料成员'
        && (string) $savedProfile->description === '持久化资料'
        && (string) $savedProfile->avatar === 'avatar.png', 'unified profile editing persists partial updates without clearing omitted fields');
    $throwsStatus(
        fn () => $profiles->update((int) $team->id + 1000000, (int) $entity->id, ['name' => '越界写入']),
        422,
        'unified profile editing preserves the existing cross-team rejection'
    );
    $throwsStatus(
        fn () => $profiles->update((int) $team->id, 0, ['name' => '不存在']),
        404,
        'unified profile editing rejects a missing entity'
    );
    $assert((string) TeamEntityProfile::where('entity_id', $entity->id)->value('name') === '保留资料成员', 'rejected cross-team profile update does not change persisted data');

    $settings->set((int) $team->id, 'member', 'departure_mode', 'disabled');
    $throwsStatus(
        fn () => $departures->apply((int) $team->id, (int) $member->id, (int) $entity->id),
        403,
        'disabled mode rejects self departure'
    );

    $settings->set((int) $team->id, 'member', 'departure_mode', 'review');
    $review = $departures->apply((int) $team->id, (int) $member->id, (int) $entity->id);
    $assert(($review['status_code'] ?? '') === 'applied', 'review mode creates a pending departure');
    $departures->cancel((int) $team->id, (int) $member->id, (int) $review['id'], (int) $entity->id);
    $assert(($departures->get((int) $team->id, (int) $review['id'])['status_code'] ?? '') === 'cancelled', 'target member can cancel a pending departure');

    $throwsStatus(
        fn () => $departures->depart((int) $team->id, (int) $ownerMember->id, (int) $ownerEntity->id),
        409,
        'team owner cannot enter departure flow'
    );

    $members->block((int) $team->id, (int) $member->id);
    $blocked = TeamMember::with(['team'])->find((int) $member->id);
    $assert($blocked?->enumCase('status') === TeamMemberStatus::Blocked, 'blocking uses lifecycle status');
    $blockedData = $blocked?->toArray() ?? [];
    $assert(
        ($blockedData['status_code'] ?? null) === 'blocked'
            && ($blockedData['status_label'] ?? null) === '已封禁'
            && !array_key_exists('status', $blockedData)
            && !array_key_exists('is_blocked', $blockedData),
        'member responses expose only stable status code and label'
    );
    $assert($blocked?->canDirectReceive() === false && $blocked?->is_valid === false, 'blocked member cannot directly receive and is unavailable by default');
    $settings->set((int) $team->id, 'member', 'inactive_entity_available', true);
    $blocked = TeamMember::with(['team'])->find((int) $member->id);
    $assert($blocked?->is_valid === true && $blocked?->canDirectReceive() === false, 'setting restores business availability without restoring direct receipt');

    $departureId = $departures->depart((int) $team->id, (int) $member->id, (int) $ownerEntity->id);
    $departed = TeamMember::with(['team'])->find((int) $member->id);
    $sameEntity = Entity::member()->where('entityable_id', (int) $member->id)->find();
    $assert($departed?->enumCase('status') === TeamMemberStatus::Departed, 'administrator departure immediately moves blocked or active member to departed');
    $assert(($departures->get((int) $team->id, $departureId)['status_code'] ?? '') === 'approved', 'administrator departure records an approved departure without review');
    $assert((int) $sameEntity?->id === (int) $entity->id && (string) $sameEntity?->slug === (string) $entity->slug, 'departure keeps the same entity and slug');
    $assert($departed?->is_valid === true && $departed?->canDirectReceive() === false, 'available departed entity still cannot be directly received');
    $assert((int) TeamMemberTenure::where('member_id', (int) $member->id)->whereNotNull('departed_at')->count() === 1, 'departure closes the current tenure');

    $form = $join->form((int) $team->id, (int) $user->id);
    $assert(($form['purpose_code'] ?? '') === 'reinstate' && ($form['fields'] ?? null) === [], 'departed member gets reinstate form without fields by default');
    $applicationId = $join->apply((int) $team->id, (int) $user->id, ['values' => [], 'memo' => 'must not persist']);
    $approvedMemberId = $join->approve((int) $team->id, $applicationId);
    $reinstated = TeamMember::with(['team'])->find((int) $member->id);
    $reinstatedEntity = Entity::member()->where('entityable_id', (int) $member->id)->find();
    $assert($approvedMemberId === (int) $member->id && $reinstated?->enumCase('status') === TeamMemberStatus::Active, 'reinstate reactivates the original member');
    $assert((int) $reinstatedEntity?->id === (int) $entity->id && (string) $reinstatedEntity?->slug === (string) $entity->slug, 'reinstate reuses entity and slug');
    $assert((int) TeamMemberTenure::where('member_id', (int) $member->id)->count() === 2, 'reinstate opens a new tenure');
    $assert((string) TeamEntityProfile::where('entity_id', (int) $entity->id)->value('name') === '保留资料成员', 'profile data survives departure and reinstate');

    $settings->set((int) $team->id, 'member', 'departure_mode', 'review');
    $pending = $departures->apply((int) $team->id, (int) $member->id, (int) $entity->id);
    $managedDepartureId = $departures->depart((int) $team->id, (int) $member->id, (int) $ownerEntity->id);
    $assert($managedDepartureId === (int) $pending['id'], 'administrator departure completes the existing self-service application');
    $assert(($departures->get((int) $team->id, $managedDepartureId)['status_code'] ?? '') === 'approved', 'completed self-service application is approved immediately');
    $applicationId = $join->apply((int) $team->id, (int) $user->id, ['values' => []]);
    $join->approve((int) $team->id, $applicationId);

    $settings->set((int) $team->id, 'member', 'departure_mode', 'auto');
    $auto = $departures->apply((int) $team->id, (int) $member->id, (int) $entity->id);
    $assert(($auto['status_code'] ?? '') === 'approved', 'auto mode creates and approves in one transaction');
    $settings->set((int) $team->id, 'member', 'inactive_entity_available', false);
    $departed = TeamMember::with(['team'])->find((int) $member->id);
    $assert($departed?->is_valid === false, 'turning the setting off immediately makes departed entity unavailable');
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Member lifecycle tests passed." . PHP_EOL);
