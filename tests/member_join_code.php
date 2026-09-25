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
use app\service\Entity as EntityService;
use app\service\MemberJoinCode;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$throws = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: got {$exception->getStatusCode()}";
        }
    } catch (Throwable $exception) {
        $failures[] = "{$case}: got " . $exception::class;
    }
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $owner = new User;
    $owner->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'username' => "join-code-owner-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $target = new User;
    $target->save([
        'phone' => '17' . random_int(100000000, 999999999),
        'username' => "join-code-target-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $foreignTarget = new User;
    $foreignTarget->save([
        'phone' => '16' . random_int(100000000, 999999999),
        'username' => "join-code-foreign-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);

    $team = new Team;
    $team->save([
        'slug' => "join-code-{$suffix}",
        'user_id' => (int) $owner->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    $foreignTeam = new Team;
    $foreignTeam->save([
        'slug' => "join-code-foreign-{$suffix}",
        'user_id' => (int) $owner->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    app(EntityService::class)->claimTeam($team);
    app(EntityService::class)->claimTeam($foreignTeam);

    $codes = app(MemberJoinCode::class);
    $join = app(\app\service\TeamJoin::class);
    app(\app\service\TeamEntityField::class)->create((int) $team->id, [
        'entity_type' => 'entity', 'field_key' => 'onboard_name', 'name' => '入职姓名',
        'value_type' => 'string', 'input_type' => 'text',
    ]);
    $entityField = \app\model\TeamEntityField::where('team_id', $team->id)->where('field_key', 'onboard_name')->find();
    $joinFieldId = $join->createField((int) $team->id, [
        'field_key' => 'onboard_name', 'name' => '入职姓名', 'is_apply_required' => 1,
        'is_transfer_entity_field' => 1, 'entity_field_id' => (int) $entityField->id,
    ]);
    $inactiveId = $join->createField((int) $team->id, ['field_key' => 'inactive', 'name' => '停用', 'is_active' => 0]);
    $internalId = $join->createField((int) $team->id, ['field_key' => 'internal', 'name' => '内部', 'is_apply_fillable' => 0]);
    $issued = $codes->issue((int) $target->id);
    $plain = (string) ($issued['code'] ?? '');
    $assert(
        preg_match('/^[0-9A-F]{20}$/', $plain) === 1
            && (int) ($issued['expires_at'] ?? 0) > time()
            && (int) ($issued['expires_at'] ?? 0) <= time() + 1800,
        'issue returns a 20-character uppercase hex code with a 30-minute expiry'
    );
    $assert(
        array_keys($issued) === ['code', 'expires_at'],
        'issue response contains no internal hash or other user fields'
    );
    $stored = User::find((int) $target->id);
    $assert(
        $stored
            && hash_equals((string) $stored->member_join_code_hash, hash('sha256', $plain))
            && (int) $stored->member_join_code_expires_at === (int) $issued['expires_at'],
        'issue stores only the SHA-256 code hash and expiry on the user'
    );
    $storedArray = $stored?->toArray() ?? [];
    $assert(
        !array_key_exists('member_join_code_hash', $storedArray)
            && !array_key_exists('member_join_code_expires_at', $storedArray),
        'user serialization hides personal join-code fields'
    );

    $replacement = $codes->issue((int) $target->id);
    $replacementCode = (string) $replacement['code'];
    $assert(
        $replacementCode !== $plain
            && !hash_equals(hash('sha256', $plain), (string) User::find((int) $target->id)->member_join_code_hash),
        'issuing again atomically replaces the previous personal code'
    );
    $throws(
        fn () => $codes->addMember((int) $team->id, $plain),
        422,
        'replaced code cannot be consumed'
    );

    $memberId = $codes->addMember((int) $team->id, "  {$replacementCode}  ");
    $member = TeamMember::find($memberId);
    $assert(!\app\model\TeamJoinApplication::where('team_id', $team->id)->where('user_id', $target->id)->find(), 'skipping optional form ignores required fields and creates no application');
    $targetAfter = User::find((int) $target->id);
    $assert(
        $member
            && (int) $member->team_id === (int) $team->id
            && (int) $member->user_id === (int) $target->id
            && $member->enumCase('status') === TeamMemberStatus::Active,
        'valid code adds the target user to any supplied team'
    );
    $assert(
        $targetAfter
            && $targetAfter->member_join_code_hash === null
            && $targetAfter->member_join_code_expires_at === null,
        'successful consumption clears the code inside the same transaction'
    );
    $throws(
        fn () => $codes->addMember((int) $foreignTeam->id, $replacementCode),
        422,
        'a consumed code is single-use'
    );

    $expired = $codes->issue((int) $foreignTarget->id);
    $foreignTarget->member_join_code_expires_at = time() - 1;
    $foreignTarget->save();
    $throws(
        fn () => $codes->addMember((int) $foreignTeam->id, (string) $expired['code']),
        422,
        'expired code is rejected'
    );
    $expiredAfter = User::find((int) $foreignTarget->id);
    $assert(
        $expiredAfter && hash_equals(
            (string) $expiredAfter->member_join_code_hash,
            hash('sha256', (string) $expired['code'])
        ),
        'expired-code failure does not consume the code'
    );

    $invalid = $codes->issue((int) $foreignTarget->id);
    $throws(
        fn () => $codes->addMember((int) $foreignTeam->id, str_repeat('0', 20)),
        422,
        'unknown code is rejected'
    );
    $assert(
        hash_equals(hash('sha256', (string) $invalid['code']), (string) User::find((int) $foreignTarget->id)->member_join_code_hash),
        'unknown-code failure does not consume the valid code'
    );

    $throws(fn () => $codes->addMember((int) $team->id, $invalid['code'], []), 422, 'opting in with an empty form enforces required fields');
    $throws(fn () => $codes->addMember((int) $team->id, $invalid['code'], ['values' => 'invalid']), 422, 'malformed form values rejected');
    $assert(!TeamMember::where('team_id', $team->id)->where('user_id', $foreignTarget->id)->find()
        && !\app\model\TeamJoinApplication::where('team_id', $team->id)->where('user_id', $foreignTarget->id)->find()
        && hash_equals(hash('sha256', $invalid['code']), (string) User::find((int) $foreignTarget->id)->member_join_code_hash), 'validation failure preserves code and creates neither member nor application');

    $filledId = $codes->addMember((int) $team->id, $invalid['code'], [
        'values' => ['onboard_name' => '代填姓名', 'inactive' => '不可保存', 'internal' => '不可保存'], 'memo' => '代填说明',
    ]);
    $application = \app\model\TeamJoinApplication::where('team_id', $team->id)->where('user_id', $foreignTarget->id)->find();
    $assert($application && $application->enumCase('status') === \app\enum\TeamJoinStatus::Joined && $application->memo === '代填说明', 'optional form saves a joined application without pending review');
    $assert(\app\model\TeamJoinFieldValue::where('application_id', $application->id)->where('field_id', $joinFieldId)->value('value_string') === '代填姓名', 'form values are retained');
    $assert(\app\model\TeamJoinFieldValue::where('application_id', $application->id)->whereIn('field_id', [$inactiveId, $internalId])->count() === 0, 'non-fillable fields cannot be injected');
    $assert(\app\model\TeamEntityFieldValue::where('entity_id', $application->entity_id)->where('field_id', $entityField->id)->value('value_string') === '代填姓名', 'configured fields transfer to the new member entity');
    $assert(TeamMemberTenure::where('member_id', $filledId)->count() === 1 && (int) TeamMemberTenure::where('member_id', $filledId)->value('join_application_id') === (int) $application->id, 'filled form creates one linked tenure');
    $assert(User::find((int) $foreignTarget->id)->member_join_code_hash === null, 'filled form consumes the code');

    $alreadyMember = new User;
    $alreadyMember->save([
        'phone' => '15' . random_int(100000000, 999999999),
        'username' => "join-code-existing-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $existing = new TeamMember;
    $existing->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $alreadyMember->id,
        'status' => TeamMemberStatus::Active,
    ]);
    $existingCode = $codes->issue((int) $alreadyMember->id);
    $throws(
        fn () => $codes->addMember((int) $team->id, (string) $existingCode['code']),
        409,
        'existing team membership is rejected'
    );
    $assert(
        hash_equals(hash('sha256', (string) $existingCode['code']), (string) User::find((int) $alreadyMember->id)->member_join_code_hash),
        'duplicate-member failure does not consume the code'
    );

    foreach ([TeamMemberStatus::Blocked, TeamMemberStatus::Departed] as $status) {
        $statusUser = new User;
        $statusUser->save([
            'phone' => '13' . random_int(100000000, 999999999),
            'username' => "join-code-status-{$status->name}-{$suffix}",
            'password' => 'join-code-test',
            'is_banned' => 0,
        ]);
        $statusMember = new TeamMember;
        $statusMember->save([
            'team_id' => (int) $team->id,
            'user_id' => (int) $statusUser->id,
            'status' => $status,
        ]);
        $statusCode = $codes->issue((int) $statusUser->id);
        $throws(
            fn () => $codes->addMember((int) $team->id, (string) $statusCode['code']),
            409,
            "{$status->name} member cannot be added again"
        );
        $throws(fn () => $codes->addMember((int) $team->id, $statusCode['code'], ['values' => ['onboard_name' => '不能绕过']]), 409, 'optional form cannot reinstate or unblock existing members');
        $assert(
            hash_equals(hash('sha256', (string) $statusCode['code']), (string) User::find((int) $statusUser->id)->member_join_code_hash),
            "{$status->name} member failure does not consume the code"
        );
    }

    $bannedTarget = new User;
    $bannedTarget->save([
        'phone' => '12' . random_int(100000000, 999999999),
        'username' => "join-code-banned-target-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $bannedCode = $codes->issue((int) $bannedTarget->id);
    $bannedTarget->is_banned = 1;
    $bannedTarget->save();
    $throws(
        fn () => $codes->addMember((int) $team->id, (string) $bannedCode['code']),
        422,
        'banned target cannot consume a previously issued code'
    );
    $assert(
        hash_equals(hash('sha256', (string) $bannedCode['code']), (string) User::find((int) $bannedTarget->id)->member_join_code_hash),
        'banned-target failure does not consume the code'
    );

    $deletedTarget = new User;
    $deletedTarget->save([
        'phone' => '11' . random_int(100000000, 999999999),
        'username' => "join-code-deleted-target-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $deletedCode = $codes->issue((int) $deletedTarget->id);
    $deletedTarget->delete();
    $throws(
        fn () => $codes->addMember((int) $team->id, (string) $deletedCode['code']),
        422,
        'deleted target cannot consume a previously issued code'
    );

    $memberControllerSource = file_get_contents(dirname(__DIR__) . '/app/team/controller/Member.php');
    $accountControllerSource = file_get_contents(dirname(__DIR__) . '/app/account/controller/Team.php');
    $assert(
        is_string($memberControllerSource)
            && str_contains($memberControllerSource, "post('join_code/s'")
            && !str_contains($memberControllerSource, "post('user_id/d'"),
        'member add controller accepts join_code and no longer accepts user_id'
    );
    $assert(
        is_string($accountControllerSource)
            && str_contains($accountControllerSource, 'issue($request->user_id)'),
        'account join-code controller uses the authenticated real user ID'
    );
    $routeSource = file_get_contents(dirname(__DIR__) . '/app/team/controller/Member.php');
    $assert(
        is_string($routeSource)
            && str_contains($routeSource, "'Permission:' . Permissions::TEAM_MEMBER_INVITE")
            && str_contains($routeSource, "'TeamWorkspaceAuth'"),
        'member add remains behind workspace and invite permission middleware'
    );

    $rollbackTarget = new User;
    $rollbackTarget->save([
        'phone' => '10' . random_int(100000000, 999999999),
        'username' => "join-code-rollback-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $rollbackCode = $codes->issue((int) $rollbackTarget->id);
    app()->delete(\app\service\TeamJoin::class);
    app()->bind(\app\service\TeamJoin::class, static fn () => new class extends \app\service\TeamJoin {
        public function approve(int $teamId, int $id): int
        {
            parent::approve($teamId, $id);
            throw new HttpException(500, 'controlled form save failure');
        }
    });
    $throws(fn () => $codes->addMember((int) $team->id, $rollbackCode['code'], ['values' => ['onboard_name' => '应回滚']]), 500, 'optional form mid-transaction failure is surfaced');
    $assert(!TeamMember::where('user_id', $rollbackTarget->id)->find()
        && !\app\model\TeamJoinApplication::where('user_id', $rollbackTarget->id)->find()
        && hash_equals(hash('sha256', $rollbackCode['code']), (string) User::find((int) $rollbackTarget->id)->member_join_code_hash), 'optional form rolls back application and member, preserving code');
    app()->delete(\app\service\TeamJoin::class);
    app()->bind(\app\service\TeamJoin::class, \app\service\TeamJoin::class);
    $pendingId = app(\app\service\TeamJoin::class)->apply((int) $team->id, (int) $rollbackTarget->id, ['values' => ['onboard_name' => '原申请']]);
    $throws(fn () => $codes->addMember((int) $team->id, $rollbackCode['code'], ['values' => ['onboard_name' => '新表单']]), 409, 'pending application is not silently replaced or approved');
    app(\app\service\TeamJoin::class)->cancel((int) $team->id, (int) $rollbackTarget->id, $pendingId);
    app()->delete(\app\service\TeamMember::class);
    app()->bind(\app\service\TeamMember::class, static fn () => new class {
        public function add(int $teamId, int $userId, array $data): int
        {
            $member = new TeamMember;
            $member->save(['team_id' => $teamId, 'user_id' => $userId, 'status' => TeamMemberStatus::Active]);
            $entity = new Entity;
            $entity->save([
                'slug' => 'rollback-' . $member->id,
                'entityable_type' => 'teamMember',
                'entityable_id' => $member->id,
                'is_displayed' => 0,
                'is_internal_visible' => 1,
                'search_override' => null,
            ]);
            $profile = new TeamEntityProfile;
            $profile->save(['entity_id' => $entity->id, 'name' => 'rollback', 'avatar' => '']);
            $tenure = new TeamMemberTenure;
            $tenure->save(['team_id' => $teamId, 'member_id' => $member->id, 'join_application_id' => null, 'joined_at' => time(), 'departed_at' => null]);
            throw new HttpException(500, 'controlled mid-transaction failure');
        }
    });
    $throws(
        fn () => $codes->addMember((int) $team->id, (string) $rollbackCode['code']),
        500,
        'mid-transaction member creation failure is surfaced'
    );
    $rollbackMemberIds = TeamMember::where('user_id', (int) $rollbackTarget->id)->column('id');
    $rollbackEntityCount = $rollbackMemberIds
        ? Entity::member()->whereIn('entityable_id', $rollbackMemberIds)->count()
        : 0;
    $assert(
        !$rollbackMemberIds && $rollbackEntityCount === 0
            && TeamMemberTenure::where('team_id', (int) $team->id)->whereIn('member_id', $rollbackMemberIds ?: [0])->count() === 0
            && hash_equals(hash('sha256', (string) $rollbackCode['code']), (string) User::find((int) $rollbackTarget->id)->member_join_code_hash),
        'mid-transaction failure rolls back member, entity, profile, tenure and keeps the code'
    );

    $banned = new User;
    $banned->save([
        'phone' => '14' . random_int(100000000, 999999999),
        'username' => "join-code-banned-{$suffix}",
        'password' => 'join-code-test',
        'is_banned' => 1,
    ]);
    $throws(fn () => $codes->issue((int) $banned->id), 403, 'banned user cannot issue a code');
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Member join code tests passed." . PHP_EOL);
