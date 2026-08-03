<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Entity;
use app\model\Team;
use app\model\TeamEntityField;
use app\model\TeamEntityFieldValue;
use app\model\TeamJoinApplication;
use app\model\TeamJoinField;
use app\model\TeamMember;
use app\model\User;
use app\service\TeamJoin;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $targetOwner = new User;
    $targetOwner->save([
        'phone' => '13' . random_int(100000000, 999999999),
        'username' => "join-target-{$suffix}",
        'password' => 'team-join-test',
    ]);
    $externalOwner = new User;
    $externalOwner->save([
        'phone' => '14' . random_int(100000000, 999999999),
        'username' => "join-external-{$suffix}",
        'password' => 'team-join-test',
    ]);
    $applicant = new User;
    $applicant->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'username' => "join-applicant-{$suffix}",
        'password' => 'team-join-test',
    ]);

    $targetData = app(\app\service\Team::class)->create(
        (int) $targetOwner->id,
        "join-target-{$suffix}",
        'Join Target'
    );
    $externalData = app(\app\service\Team::class)->create(
        (int) $externalOwner->id,
        "join-external-{$suffix}",
        'Join External'
    );
    $targetTeam = Team::find((int) $targetData['id']);
    $externalTeam = Team::find((int) $externalData['id']);
    $targetMember = TeamMember::where('team_id', $targetTeam->id)
        ->where('user_id', $targetOwner->id)
        ->find();
    $externalMember = TeamMember::where('team_id', $externalTeam->id)
        ->where('user_id', $externalOwner->id)
        ->with('identity')
        ->find();
    $externalInviter = $externalMember?->identity;

    $join = app(TeamJoin::class);
    app(\app\service\TeamEntityField::class)->create((int) $targetTeam->id, [
        'entity_type' => 'entity',
        'field_key' => 'join_experience',
        'name' => '加入经验',
        'value_type' => 'string',
        'input_type' => 'text',
    ]);
    app(\app\service\TeamEntityField::class)->create((int) $targetTeam->id, [
        'entity_type' => 'customer',
        'field_key' => 'customer_note',
        'name' => '客户备注',
        'value_type' => 'string',
        'input_type' => 'text',
    ]);
    app(\app\service\TeamEntityField::class)->create((int) $externalTeam->id, [
        'entity_type' => 'entity',
        'field_key' => 'external_experience',
        'name' => '外部经验',
        'value_type' => 'string',
        'input_type' => 'text',
    ]);
    $targetEntityField = TeamEntityField::where('team_id', $targetTeam->id)
        ->where('field_key', 'join_experience')
        ->find();
    $customerEntityField = TeamEntityField::where('team_id', $targetTeam->id)
        ->where('field_key', 'customer_note')
        ->find();
    $externalEntityField = TeamEntityField::where('team_id', $externalTeam->id)
        ->where('field_key', 'external_experience')
        ->find();

    $inactiveFieldId = $join->createField((int) $targetTeam->id, [
        'field_key' => 'inactive_field',
        'name' => '停用字段',
        'is_active' => 0,
        'sort' => 5,
    ]);
    $internalFieldId = $join->createField((int) $targetTeam->id, [
        'field_key' => 'internal_field',
        'name' => '不由申请人填写',
        'is_apply_fillable' => 0,
        'sort' => 10,
    ]);
    $transferFieldId = $join->createField((int) $targetTeam->id, [
        'field_key' => 'experience',
        'name' => '相关经验',
        'is_apply_required' => 1,
        'is_transfer_entity_field' => 1,
        'entity_field_id' => (int) $targetEntityField->id,
        'sort' => 20,
    ]);
    $plainFieldId = $join->createField((int) $targetTeam->id, [
        'field_key' => 'portfolio',
        'name' => '作品说明',
        'sort' => 30,
    ]);

    $managedFieldIds = array_map('intval', array_column($join->fields((int) $targetTeam->id), 'id'));
    $publicFieldIds = array_map('intval', array_column($join->fields((int) $targetTeam->id, true), 'id'));
    $assert(
        array_slice($managedFieldIds, 0, 4) === [$inactiveFieldId, $internalFieldId, $transferFieldId, $plainFieldId],
        'join field management lists active and inactive fields in configured order'
    );
    $assert(
        !in_array($inactiveFieldId, $publicFieldIds, true)
            && !in_array($internalFieldId, $publicFieldIds, true)
            && in_array($transferFieldId, $publicFieldIds, true),
        'public join form only lists active applicant-fillable fields'
    );

    $transferOptionIds = array_map('intval', array_column($join->transferOptions((int) $targetTeam->id), 'id'));
    $assert(
        in_array((int) $targetEntityField->id, $transferOptionIds, true)
            && !in_array((int) $customerEntityField->id, $transferOptionIds, true)
            && !in_array((int) $externalEntityField->id, $transferOptionIds, true),
        'join transfer options only expose current-team personnel entity fields'
    );

    $duplicateRejected = false;
    try {
        $join->createField((int) $targetTeam->id, [
            'field_key' => 'experience',
            'name' => '重复字段',
        ]);
    } catch (HttpException $exception) {
        $duplicateRejected = $exception->getStatusCode() === 409;
    }
    $assert($duplicateRejected, 'join field keys remain unique within a team');

    $join->updateField((int) $targetTeam->id, $inactiveFieldId, ['name' => '停用字段', 'is_active' => 1]);
    $publicAfterEnable = array_map('intval', array_column($join->fields((int) $targetTeam->id, true), 'id'));
    $assert(in_array($inactiveFieldId, $publicAfterEnable, true), 'inactive join fields can be re-enabled from management');
    $join->updateField((int) $targetTeam->id, $inactiveFieldId, ['name' => '停用字段', 'is_active' => 0]);

    $disposableFieldId = $join->createField((int) $targetTeam->id, [
        'field_key' => 'disposable_field',
        'name' => '可删除字段',
        'sort' => 40,
    ]);
    $join->deleteField((int) $targetTeam->id, $disposableFieldId);
    $assert(!TeamJoinField::find($disposableFieldId), 'join fields without submitted values can be deleted');

    $applicationId = $join->apply((int) $targetTeam->id, (int) $applicant->id, [
        'values' => ['experience' => '两年相关经验'],
        'memo' => 'cross-team inviter test',
        'inviter_slug' => (string) ($externalInviter?->slug ?? ''),
    ]);
    $application = TeamJoinApplication::find($applicationId);
    $assert(
        (int) $application->inviter_entity_id === (int) ($externalInviter?->id ?? 0),
        'join application stores a valid inviter from another team'
    );

    $detail = $join->get((int) $targetTeam->id, $applicationId, (int) $applicant->id);
    $assert(
        ($detail['inviter']['slug'] ?? '') === (string) ($externalInviter?->slug ?? '')
            && ($detail['inviter']['is_external'] ?? false) === true
            && (int) ($detail['inviter']['team']['id'] ?? 0) === (int) $externalTeam->id,
        'join application returns the cross-team inviter summary'
    );

    $memberId = $join->approve((int) $targetTeam->id, $applicationId);
    $member = TeamMember::find($memberId);
    $assert(
        (int) $member->inviter_entity_id === (int) ($externalInviter?->id ?? 0),
        'approval copies the application inviter to the member'
    );

    $approvedEntity = Entity::where('entityable_type', 'teamMember')
        ->where('entityable_id', $memberId)
        ->find();
    $transferredValue = TeamEntityFieldValue::where('field_id', $targetEntityField->id)
        ->where('entity_id', $approvedEntity->id)
        ->find();
    $assert(
        ($transferredValue?->value_string ?? null) === '两年相关经验',
        'approval transfers configured join values to the new member entity field'
    );
    $usedFieldRejected = false;
    try {
        $join->deleteField((int) $targetTeam->id, $transferFieldId);
    } catch (HttpException $exception) {
        $usedFieldRejected = $exception->getStatusCode() === 409;
    }
    $assert($usedFieldRejected, 'join fields with submitted values cannot be deleted');

    $targetEntity = Entity::where('entityable_type', 'teamMember')
        ->where('entityable_id', $targetMember->id)
        ->find();
    $memberDetail = app(\app\service\TeamMember::class)->get(
        (int) $targetTeam->id,
        $memberId,
        [
            'entity_id' => (int) $targetEntity->id,
            'type' => 'teamMember',
            'id' => (int) $targetMember->id,
        ]
    );
    $assert(
        (int) ($memberDetail['create_time'] ?? 0) > 0
            && ($memberDetail['inviter']['slug'] ?? '') === (string) ($externalInviter?->slug ?? '')
            && ($memberDetail['inviter']['is_external'] ?? false) === true,
        'member detail exposes join time and cross-team inviter'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Team join field and inviter tests passed\n");
