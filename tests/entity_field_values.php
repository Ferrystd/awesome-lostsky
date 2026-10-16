<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Entity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamEntityFieldValue;
use app\model\TeamEntityRole;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
use app\model\User;
use app\service\Entity as Entities;
use app\service\PermissionDictionary as Permissions;
use app\service\TeamEntityField;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();
if (!in_array(env('DB_HOST'), ['127.0.0.1', 'localhost', '::1'], true)) {
    throw new RuntimeException('This transactional fixture requires a local database');
}
$checks = 0;
$assert = static function (bool $condition, string $case) use (&$checks): void {
    if (!$condition) throw new RuntimeException($case);
    $checks++;
};
$status = static function (callable $run, int $expected, string $case) use ($assert): void {
    try {
        $run();
    } catch (HttpException $error) {
        $assert($error->getStatusCode() === $expected, $case);
        return;
    }
    throw new RuntimeException($case . ': missing exception');
};
$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $user = new User;
    $user->save(['phone' => '17' . random_int(100000000, 999999999), 'username' => "field-values-{$suffix}", 'password' => 'test-only']);
    $makeTeam = static function (string $slug) use ($user): Team {
        $team = new Team;
        $team->save(['slug' => $slug, 'user_id' => (int) $user->id]);
        app(Entities::class)->claimTeam($team);
        return $team;
    };
    $team = $makeTeam("field-values-{$suffix}");
    $otherTeam = $makeTeam("field-other-{$suffix}");
    $makeVirtual = static function (Team $team, string $slug, bool $visible = true): Entity {
        $virtual = new TeamVirtual;
        $virtual->save(['team_id' => (int) $team->id, 'name' => $slug, 'is_active' => 1]);
        $entity = app(Entities::class)->claimVirtual($virtual, $slug);
        $entity->save(['is_internal_visible' => (int) $visible]);
        return $entity;
    };
    $actor = $makeVirtual($team, "field-actor-{$suffix}");
    $visible = $makeVirtual($team, "field-visible-{$suffix}");
    $hidden = $makeVirtual($team, "field-hidden-{$suffix}", false);
    $inactive = $makeVirtual($team, "field-inactive-{$suffix}");
    TeamVirtual::find($inactive->entityable_id)->save(['is_active' => 0]);
    $deleted = $makeVirtual($team, "field-deleted-{$suffix}");
    $foreign = $makeVirtual($otherTeam, "field-foreign-{$suffix}");
    $empty = $makeVirtual($team, "field-empty-{$suffix}");
    $service = app(TeamEntityField::class);
    $makeField = static fn (string $type, string $valueType, string $key): int => $service->create((int) $team->id, [
        'entity_type' => $type, 'field_key' => $key, 'name' => $key,
        'value_type' => $valueType, 'visibility' => \app\enum\Visibility::Team->value,
    ]);
    $fieldId = $makeField('virtual', 'json', 'aggregate_json');
    $store = static function (int $fieldId, Entity $entity, string $column, mixed $value, ?int $teamId = null) use ($team): void {
        $stored = new TeamEntityFieldValue;
        $stored->save(['team_id' => $teamId ?? (int) $team->id, 'field_id' => $fieldId,
            'entity_id' => (int) $entity->id, $column => $value]);
    };
    foreach ([[$actor, false], [$visible, 0], [$hidden, 'secret'], [$inactive, 'inactive'],
        [$deleted, 'deleted'], [$foreign, 'foreign'], [$empty, []]] as [$entity, $value]) {
        $store($fieldId, $entity, 'value_json', $value);
    }
    $deleted->delete();
    $base = $service->fieldValues((int) $team->id, $fieldId, 1, 1, false);
    $assert($base['total'] === 2 && $base['data'][0]['value'] === false, 'filter before total/page and preserve JSON false');
    $assert($base['data'][0]['type'] === 'teamVirtual' && $base['data'][0]['slug'] === $actor->slug, 'stable identity contract');
    $second = $service->fieldValues((int) $team->id, $fieldId, 2, 1, false);
    $assert($second['total'] === 2 && $second['data'][0]['value'] === 0, 'second page preserves JSON zero');
    $assert($second['data'][0]['entity_id'] === (int) $visible->id, 'stable entity_id ordering');
    $all = $service->fieldValues((int) $team->id, $fieldId, 1, 100, true);
    $assert($all['total'] === 3 && array_column($all['data'], 'entity_id') === [(int) $actor->id, (int) $visible->id, (int) $hidden->id], 'read-all includes hidden but excludes inactive/deleted/cross-team subjects');
    $normalized = $service->fieldValues((int) $team->id, $fieldId, 0, 999, false);
    $assert($normalized['current_page'] === 1 && $normalized['per_page'] === 100, 'existing pagination normalization');
    $beyond = $service->fieldValues((int) $team->id, $fieldId, 4, 1, false);
    $assert($beyond['data'] === [] && $beyond['total'] === 2, 'out-of-range page preserves readable total');
    $status(fn () => $service->fieldValues((int) $otherTeam->id, $fieldId, 1, 20, true), 404, 'field definition cannot cross teams');

    foreach (['bool' => ['value_int', 0, false], 'int' => ['value_int', 0, 0],
        'decimal' => ['value_decimal', '0.00', '0.0000'], 'date' => ['value_datetime', 0, 0],
        'datetime' => ['value_datetime', 1720000000, 1720000000], 'string' => ['value_string', '', null],
        'text' => ['value_text', null, null], 'multi_select' => ['value_json', [], null]] as $type => [$column, $value, $expected]) {
        $typedId = $makeField('virtual', $type, 'aggregate_' . $type);
        $store($typedId, $actor, $column, $value);
        $typed = $service->fieldValues((int) $team->id, $typedId, 1, 20, false);
        if ($expected === null) {
            $assert($typed['total'] === 0 && $typed['data'] === [], "{$type} empty value excluded");
        } elseif ($type === 'decimal') {
            $assert(is_string($typed['data'][0]['value']) && (float) $typed['data'][0]['value'] === 0.0, 'decimal remains an exact string');
        } else {
            $assert($typed['total'] === 1 && $typed['data'][0]['value'] === $expected, "{$type} typed zero/value preserved");
        }
    }

    $customer = new TeamCustomer;
    $customer->save(['team_id' => (int) $team->id, 'user_id' => (int) $user->id, 'is_blocked' => 0]);
    $customerEntity = app(Entities::class)->claimCustomer((int) $customer->id, "field-customer-{$suffix}");
    $customerEntity->save(['is_internal_visible' => 1]);
    $customerField = $makeField('customer', 'string', 'aggregate_customer');
    $store($customerField, $customerEntity, 'value_string', 'customer secret');
    $assert($service->fieldValues((int) $team->id, $customerField, 1, 20, false)['total'] === 0, 'customer excluded even when internally visible');
    $assert($service->fieldValues((int) $team->id, $customerField, 1, 20, true)['total'] === 1, 'read-all grants valid customer directory read');
    $customer->save(['is_blocked' => 1]);
    $assert($service->fieldValues((int) $team->id, $customerField, 1, 20, true)['total'] === 0, 'blocked customer excluded');

    $entityField = $makeField('entity', 'string', 'aggregate_entity');
    $teamEntity = app(Entities::class)->requireBySubject('team', (int) $team->id);
    $store($entityField, $teamEntity, 'value_string', 'team value');
    $member = new \app\model\TeamMember;
    $member->save(['team_id' => (int) $team->id, 'user_id' => (int) $user->id, 'status' => \app\enum\TeamMemberStatus::Active]);
    $memberEntity = app(Entities::class)->claimMember((int) $team->id, (int) $member->id, "field-member-{$suffix}");
    $store($entityField, $memberEntity, 'value_string', 'member value');
    $store($entityField, $visible, 'value_string', 'wrong subject type');
    $entityValues = $service->fieldValues((int) $team->id, $entityField, 1, 20, false);
    $assert(array_column($entityValues['data'], 'type') === ['team', 'teamMember'], 'entity fields include Team and Member, excluding wrong stored subject types');
    $memberEntity->save(['is_internal_visible' => 0]);
    $assert($service->fieldValues((int) $team->id, $entityField, 1, 20, false)['total'] === 1, 'hidden member follows directory scope');
    $assert($service->fieldValues((int) $team->id, $entityField, 1, 20, true)['total'] === 2, 'read-all includes hidden valid member');
    foreach ([\app\enum\TeamMemberStatus::Blocked, \app\enum\TeamMemberStatus::Departed] as $memberStatus) {
        $inactiveUser = new User;
        $inactiveUser->save(['phone' => '17' . random_int(100000000, 999999999),
            'username' => "field-inactive-{$memberStatus->value}-{$suffix}", 'password' => 'test-only']);
        $inactiveMember = new \app\model\TeamMember;
        $inactiveMember->save(['team_id' => (int) $team->id, 'user_id' => (int) $inactiveUser->id,
            'status' => \app\enum\TeamMemberStatus::Active]);
        $inactiveEntity = app(Entities::class)->claimMember((int) $team->id, (int) $inactiveMember->id,
            "field-inactive-member-{$memberStatus->value}-{$suffix}");
        $inactiveMember->save(['status' => $memberStatus]);
        $store($entityField, $inactiveEntity, 'value_string', 'inactive member value');
    }
    $setting = new \app\model\TeamSetting;
    $setting->save(['team_id' => (int) $team->id, 'app_name' => 'member',
        'key' => 'inactive_entity_available', 'value' => '0']);
    $settingReads = 0;
    $trackSettings = false;
    $db->listen(static function (string $sql) use (&$settingReads, &$trackSettings): void {
        if ($trackSettings && preg_match('/^SELECT.*FROM `team_setting`/i', $sql)) $settingReads++;
    });
    foreach ([false, true] as $available) {
        $setting->save(['value' => $available ? '1' : '0']);
        $settingReads = 0;
        $trackSettings = true;
        $inactiveValues = $service->fieldValues((int) $team->id, $entityField, 1, 1, true);
        $trackSettings = false;
        $assert($inactiveValues['total'] === ($available ? 4 : 2), 'inactive member setting preserves model semantics before pagination');
        $assert($settingReads === 1, 'multiple non-active members read team_setting exactly once per aggregate');
    }
    $typedId = $makeField('virtual', 'string', 'aggregate_old_column');
    $store($typedId, $actor, 'value_int', 12);
    $store($typedId, $visible, 'value_string', 'wrong team row', (int) $otherTeam->id);
    $assert($service->fieldValues((int) $team->id, $typedId, 1, 20, true)['total'] === 0, 'read only the saved type column and reject value rows of another team');
    $softId = $makeField('virtual', 'string', 'aggregate_deleted_value');
    $store($softId, $actor, 'value_string', 'deleted value');
    TeamEntityFieldValue::where('field_id', $softId)->find()->delete();
    $assert($service->fieldValues((int) $team->id, $softId, 1, 20, true)['total'] === 0, 'soft-deleted field values excluded');

    $acting = ['entity_id' => (int) $actor->id, 'type' => 'teamVirtual', 'id' => (int) $actor->entityable_id];
    $request = (new Request)->withGet(['id' => $fieldId, 'page' => 1, 'limit' => 20]);
    $request->team_id = (int) $team->id;
    $request->acting_entity = $acting;
    $controller = app(\app\team\controller\EntityField::class);
    $status(fn () => $controller->fieldValues($request), 403, 'no field management permission is denied');
    $role = new TeamRole;
    $role->save(['team_id' => (int) $team->id, 'role_key' => 'aggregate_reader', 'name' => 'Aggregate reader']);
    $binding = new TeamEntityRole;
    $binding->save(['team_id' => (int) $team->id, 'role_id' => (int) $role->id, 'entity_id' => (int) $actor->id]);
    $grant = static function (string $key) use ($team, $role): void {
        $permission = new TeamRolePermission;
        $permission->save(['team_id' => (int) $team->id, 'role_id' => (int) $role->id, 'permission_key' => $key]);
    };
    $grant(Permissions::virtual((string) $actor->slug, 'field.manage'));
    $status(fn () => $controller->fieldValues($request), 403, 'slug-only field management cannot read type aggregate');
    $grant(Permissions::TEAM_ENTITY_VIRTUAL_ALL_FIELD_MANAGE);
    $response = $controller->fieldValues($request)->getData();
    $assert($response['code'] === 0 && $response['data']['total'] === 2, 'type manager can read Team-visible fields but cannot reveal hidden directory persons');
    $grant(Permissions::TEAM_ENTITY_READ);
    $response = $controller->fieldValues($request)->getData();
    $assert($response['data']['total'] === 3, 'independent directory permission expands aggregate');
    $customerRequest = (new Request)->withGet(['id' => $customerField]);
    $customerRequest->team_id = (int) $team->id;
    $customerRequest->acting_entity = $acting;
    $status(fn () => $controller->fieldValues($customerRequest), 403, 'virtual manager cannot read customer fields');
} finally {
    $db->rollback();
}
echo "Entity field values: {$checks} checks passed; fixture rolled back\n";
