<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\ManageScope;
use app\enum\Visibility;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamVirtual;
use app\model\User;
use app\service\EntitySelfManagement;
use app\service\IdentitySession;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$assertStatus = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HTTP {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: expected HTTP {$status}, got {$exception->getStatusCode()}";
        }
    } catch (Throwable $exception) {
        $failures[] = "{$case}: expected HttpException, got " . $exception::class;
    }
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $owner = new User;
    $owner->save([
        'phone' => '15' . random_int(100000000, 999999999),
        'password' => 'self-management-test',
        'username' => "self-owner-{$suffix}",
    ]);
    $teamData = app(\app\service\Team::class)->create(
        (int) $owner->id,
        "self-{$suffix}",
        'Self Management Team'
    );
    $team = Team::find((int) $teamData['id']);
    $member = \app\model\TeamMember::where('team_id', $team->id)
        ->where('user_id', $owner->id)
        ->with(['identity'])
        ->find();
    $memberEntity = $member->identity;

    $virtual = new TeamVirtual;
    $virtual->save(['team_id' => (int) $team->id, 'name' => 'Self Bot', 'is_active' => 1]);
    $virtualEntity = app(\app\service\Entity::class)->claimVirtual($virtual, "self-bot-{$suffix}");

    $customer = new TeamCustomer;
    $customer->save(['team_id' => (int) $team->id, 'user_id' => (int) $owner->id, 'is_blocked' => 0]);
    $customerEntity = app(\app\service\Entity::class)->claimCustomer(
        (int) $customer->id,
        "self-customer-{$suffix}"
    );

    $teamEntity = app(\app\service\Entity::class)->requireBySubject('team', (int) $team->id);
    $memberActing = ['entity_id' => (int) $memberEntity->id, 'type' => 'teamMember', 'id' => (int) $member->id];
    $virtualActing = ['entity_id' => (int) $virtualEntity->id, 'type' => 'teamVirtual', 'id' => (int) $virtual->id];
    $customerActing = ['entity_id' => (int) $customerEntity->id, 'type' => 'teamCustomer', 'id' => (int) $customer->id];
    $teamActing = ['entity_id' => (int) $teamEntity->id, 'type' => 'team', 'id' => (int) $team->id];
    $service = app(EntitySelfManagement::class);
    $identitySession = app(IdentitySession::class);

    $assert($service->current(null) === ['identity' => null, 'supported' => false], 'teamless current state is explicit');
    foreach ([
        'teamMember' => $memberActing,
        'teamVirtual' => $virtualActing,
    ] as $type => $acting) {
        $current = $service->current($acting);
        $assert(
            ($current['supported'] ?? false) === true
                && ($current['identity']['type'] ?? '') === $type
                && (int) ($current['identity']['entity_id'] ?? 0) === (int) $acting['entity_id'],
            "{$type} can manage only the current leaf entity"
        );
    }
    $customerCurrent = $service->current($customerActing);
    $assert(
        ($customerCurrent['supported'] ?? true) === false,
        'customer self-management stays in the Shop customer center'
    );
    $teamCurrent = $service->current($teamActing);
    $assert(
        ($teamCurrent['supported'] ?? false) === true
            && ($teamCurrent['identity']['type'] ?? '') === 'team',
        'team entity can enter the personal workspace with type-specific limits'
    );
    $assert(($identitySession->currentTarget($teamActing)['kind'] ?? '') === 'team-personal', 'legacy Team deep link targets Team personal workspace');
    $assert(($identitySession->currentTarget($customerActing)['kind'] ?? '') === 'shop-customer', 'legacy customer deep link targets Shop customer center');

    $fieldService = app(\app\service\TeamEntityField::class);
    $assert(
        (int) $fieldService->teamActor((int) $team->id, (string) $virtualEntity->slug)['entity_id'] === (int) $virtualEntity->id,
        'entity-field actor lookup preserves the same-team identity'
    );
    $assertStatus(
        fn () => $fieldService->teamActor((int) $team->id + 1000000, (string) $virtualEntity->slug),
        404,
        'entity-field actor lookup rejects an identity from another team'
    );
    $assertStatus(
        fn () => $fieldService->teamActor((int) $team->id, "missing-{$suffix}"),
        404,
        'entity-field actor lookup rejects a missing identity'
    );
    $fieldService->create((int) $team->id, [
        'entity_type' => 'virtual',
        'field_key' => "self_note_{$suffix}",
        'name' => '本人备注',
        'value_type' => 'string',
        'input_type' => 'text',
        'manager_scope' => ManageScope::SubjectTeam->value,
        'visibility' => Visibility::SubjectTeam->value,
        'is_required' => 0,
    ]);
    $field = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "self_note_{$suffix}")
        ->find();
    $service->saveFields($virtualActing, (int) $virtualEntity->id, [(int) $field->id => 'leaf-only']);
    $stored = \app\model\TeamEntityFieldValue::where('entity_id', $virtualEntity->id)
        ->where('field_id', $field->id)
        ->find();
    $assert((string) ($stored?->value_string ?? '') === 'leaf-only', 'editable SubjectTeam field is saved for current entity');

    $fieldService->create((int) $team->id, [
        'entity_type' => 'entity',
        'field_key' => "team_self_note_{$suffix}",
        'name' => 'Team 本人备注',
        'value_type' => 'string',
        'input_type' => 'text',
        'manager_scope' => ManageScope::SubjectTeam->value,
        'visibility' => Visibility::SubjectTeam->value,
        'is_required' => 0,
    ]);
    $teamField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', "team_self_note_{$suffix}")
        ->find();
    $service->saveFields($teamActing, (int) $teamEntity->id, [(int) $teamField->id => 'team-self']);
    $assert(
        (string) \app\model\TeamEntityFieldValue::where('entity_id', $teamEntity->id)
            ->where('field_id', $teamField->id)
            ->value('value_string') === 'team-self',
        'Team Entity can save its own editable entity field'
    );
    $service->updateProfile($teamActing, (int) $teamEntity->id, ['name' => 'Updated Team Entity']);
    $assert(
        (string) \app\model\TeamEntityProfile::where('entity_id', $teamEntity->id)->value('name') === 'Updated Team Entity',
        'Team Entity can update its personal-workspace profile'
    );

    $service->updateProfile($virtualActing, (int) $virtualEntity->id, [
        'name' => 'Updated Bot',
        'description' => 'virtual profile',
        'is_displayed' => 1,
        'status' => 0,
    ]);
    $virtualProfile = \app\model\TeamEntityProfile::where('entity_id', $virtualEntity->id)->find();
    $assert(
        (string) $virtualProfile->name === 'Updated Bot'
            && (int) \app\model\Entity::find($virtualEntity->id)->is_displayed === 0,
        'profile whitelist does not alter display or status controls'
    );

    $assertStatus(
        fn () => $service->updateProfile($customerActing, (int) $customerEntity->id, ['name' => 'Wrong workspace']),
        403,
        'customer cannot write through Team personal self-management'
    );

    $memberBefore = \app\model\TeamEntityProfile::where('entity_id', $memberEntity->id)->value('name');
    $virtualBefore = (string) $virtualProfile->name;
    $assertStatus(
        fn () => $service->updateProfile($memberActing, (int) $virtualEntity->id, ['name' => 'Wrong target']),
        409,
        'stale expected entity is rejected after member to virtual to member switching'
    );
    $assert(
        \app\model\TeamEntityProfile::where('entity_id', $memberEntity->id)->value('name') === $memberBefore
            && \app\model\TeamEntityProfile::where('entity_id', $virtualEntity->id)->value('name') === $virtualBefore,
        'stale write changes neither previous nor current entity'
    );

    $uploadCapability = $service->current($virtualActing)['capabilities']['upload'] ?? [];
    $assert(
        !str_contains((string) ($uploadCapability['reason'] ?? ''), 'file.upload'),
        'team personal resource upload no longer requires file.upload permission'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

echo "Identity self-management tests passed" . PHP_EOL;
