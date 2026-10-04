<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
(new \think\App(dirname(__DIR__)))->initialize();
set_exception_handler(static function (Throwable $e): void { fwrite(STDERR, $e::class . ": " . $e->getMessage() . "\n"); exit(1); });
use app\model\{User, TeamMember, Entity, TeamEntityField, TeamEntityFieldValue, TeamJoinField, TeamJoinFieldValue, TeamJoinApplication, TeamMemberTenure};
use app\service\{TeamJoin, MemberJoinCode};
use think\exception\HttpException;
$checks = 0;
$check = static function (bool $ok, string $label) use (&$checks): void { if (!$ok) throw new RuntimeException($label); ++$checks; };
$suffix = bin2hex(random_bytes(5));
$user = static function () use ($suffix): User {
    $u = new User;
    $u->save(['phone' => '19' . random_int(100000000, 999999999), 'username' => 'join-values-' . $suffix . '-' . bin2hex(random_bytes(3)), 'password' => 'fixture']);
    return $u;
};
$db = app()->db;
$db->startTrans();
try {
    $owner = $user();
    $teamId = (int) app(\app\service\Team::class)->create((int) $owner->id, 'jv-' . $suffix, 'Join values')['id'];
    $join = app(TeamJoin::class);
    $fieldId = $join->createField($teamId, ['field_key' => 'answer', 'name' => '申请答案', 'value_type' => 'int', 'input_type' => 'text']);
    $applicant = $user();
    $invalid = static function (callable $call) use ($check): void {
        try { $call(); throw new RuntimeException('invalid value was accepted'); }
        catch (HttpException $e) { $check($e->getStatusCode() === 422 && str_contains($e->getMessage(), '申请答案'), '422 includes field name: ' . $e->getMessage()); }
    };
    foreach ([['int', 'number', 'abc', null], ['int', 'number', '1.9', null], ['bool', 'switch', 'yes', null], ['date', 'date', 'not-date', null], ['json', 'textarea', '{', null], ['select', 'select', 'no', ['yes']], ['multi_select', 'select', ['no'], ['yes']], ['string', 'text', str_repeat('x', 501), null]] as [$type, $input, $value, $options]) {
        TeamJoinField::where('id', $fieldId)->update(['value_type' => $type, 'input_type' => $input, 'options' => $options]);
        $invalid(fn () => $join->apply($teamId, (int) $applicant->id, ['values' => ['answer' => $value]]));
        $check(TeamJoinApplication::where('user_id', $applicant->id)->count() === 0, 'invalid application fully rolls back');
    }
    TeamJoinField::where('id', $fieldId)->update(['value_type' => 'int', 'input_type' => 'text', 'options' => null, 'default_value' => '7']);
    $id = $join->apply($teamId, (int) $applicant->id, ['values' => []]);
    $check((int) TeamJoinFieldValue::where('application_id', $id)->value('value_int') === 7, 'valid default is normalized');
    $join->cancel($teamId, (int) $applicant->id, $id);
    TeamJoinField::where('id', $fieldId)->update(['is_apply_required' => 1]);
    $invalid(fn () => $join->apply($teamId, (int) $applicant->id, ['values' => []]));
    TeamJoinField::where('id', $fieldId)->update(['is_apply_required' => 0, 'default_value' => null]);
    $code = app(MemberJoinCode::class)->issue((int) $applicant->id);
    $invalid(fn () => app(MemberJoinCode::class)->addMember($teamId, $code['code'], ['values' => ['answer' => 'abc']]));
    $check(User::find($applicant->id)->member_join_code_hash === hash('sha256', $code['code']) && !TeamMember::where('user_id', $applicant->id)->find(), 'invalid admin prefill keeps code and no member');
    $departed = $user();
    $member = new TeamMember;
    $member->save(['team_id' => $teamId, 'user_id' => $departed->id, 'status' => \app\enum\TeamMemberStatus::Departed]);
    app(\app\service\Entity::class)->claimMember($teamId, (int) $member->id, 'jv-departed-' . $suffix);
    app(\app\service\TeamSetting::class)->set($teamId, 'member', 'reinstate_refill_join_fields', true);
    $invalid(fn () => $join->apply($teamId, (int) $departed->id, ['values' => ['answer' => 'abc']]));
    $check(TeamJoinApplication::where('user_id', $departed->id)->count() === 0, 'invalid reinstatement rolls back');
    $entityFieldId = app(\app\service\TeamEntityField::class)->create($teamId, ['entity_type' => 'entity', 'field_key' => 'answer', 'name' => '档案答案', 'value_type' => 'json', 'input_type' => 'textarea']);
    TeamJoinField::where('id', $fieldId)->update(['value_type' => 'json', 'is_transfer_entity_field' => 1, 'entity_field_id' => $entityFieldId]);
    foreach (['"hello"' => 'hello', 'true' => true, 'false' => false, 'null' => null, '42' => 42, '0' => 0, '[]' => [], '{"a":1}' => ['a' => 1]] as $raw => $expected) {
        $candidate = $user();
        $id = $join->apply($teamId, (int) $candidate->id, ['values' => ['answer' => (string) $raw]]);
        $saved = TeamJoinFieldValue::where('application_id', $id)->find();
        $check($saved->value_json === $expected, 'normalized JSON scalar survives application save raw=' . $raw . ' actual=' . var_export($saved->value_json, true));
        $memberId = $join->approve($teamId, $id);
        $entity = Entity::member()->where('entityable_id', $memberId)->find();
        $saved = TeamEntityFieldValue::where('entity_id', $entity->id)->where('field_id', $entityFieldId)->find();
        $check($saved->value_json === $expected, 'normalized JSON scalar survives transfer');
    }
    TeamJoinField::where('id', $fieldId)->update(['value_type' => 'string']);
    $candidate = $user();
    $id = $join->apply($teamId, (int) $candidate->id, ['values' => ['answer' => 'wrong']]);
    TeamEntityField::where('id', $entityFieldId)->update(['value_type' => 'int']);
    $counts = [TeamMember::count(), Entity::count(), TeamMemberTenure::count(), TeamEntityFieldValue::count()];
    try { $join->approve($teamId, $id); throw new RuntimeException('incompatible target accepted'); }
    catch (HttpException $e) { $check($e->getStatusCode() === 422 && str_contains($e->getMessage(), '档案答案'), 'changed target validates and names field'); }
    $check($counts === [TeamMember::count(), Entity::count(), TeamMemberTenure::count(), TeamEntityFieldValue::count()], 'approval failure rolls back member entity tenure and fields');
    $check(TeamJoinApplication::find($id)->enumCase('status') === \app\enum\TeamJoinStatus::Applied, 'approval status rolls back');
    $join->cancel($teamId, (int) $candidate->id, $id);
    $id = $join->apply($teamId, (int) $candidate->id, ['values' => ['answer' => '12']]);
    $memberId = $join->approve($teamId, $id);
    $entity = Entity::member()->where('entityable_id', $memberId)->find();
    $check((int) TeamEntityFieldValue::where('entity_id', $entity->id)->value('value_int') === 12, 'different source target types accept strictly valid value');
    TeamEntityField::where('id', $entityFieldId)->update(['is_required' => 1]);
    $candidate = $user();
    $id = $join->apply($teamId, (int) $candidate->id, ['values' => []]);
    try { $join->approve($teamId, $id); throw new RuntimeException('required empty target accepted'); }
    catch (HttpException $e) { $check($e->getStatusCode() === 422, 'target required rule rechecked'); }
    TeamEntityField::where('id', $entityFieldId)->update(['value_type' => 'select', 'is_required' => 0, 'options' => ['other']]);
    $candidate = $user();
    $id = $join->apply($teamId, (int) $candidate->id, ['values' => ['answer' => 'yes']]);
    try { $join->approve($teamId, $id); throw new RuntimeException('changed target option accepted'); }
    catch (HttpException $e) { $check($e->getStatusCode() === 422 && str_contains($e->getMessage(), '档案答案'), 'changed target options are rechecked'); }
    TeamEntityField::where('id', $entityFieldId)->update(['value_type' => 'json', 'is_required' => 1, 'options' => null]);
    $candidate = $user();
    $id = $join->apply($teamId, (int) $candidate->id, ['values' => ['answer' => 'null']]);
    try { $join->approve($teamId, $id); throw new RuntimeException('normalized null required target accepted'); }
    catch (HttpException $e) { $check($e->getStatusCode() === 422, 'required target rejects normalized JSON null'); }

} finally { $db->rollback(); }
echo "Team join values: {$checks} assertions passed; fixtures rolled back.\n";
