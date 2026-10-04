<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\WeiboReason;
use app\model\WeiboAccount;
use app\service\WeiboProtocol;
use think\App;

(new App(dirname(__DIR__)))->initialize();

$errors = [];
$assert = static function (bool $condition, string $message) use (&$errors): void { if (!$condition) $errors[] = $message; };

final class FakeWeiboProtocol extends WeiboProtocol
{
    public array $responses = [];
    public array $calls = [];
    protected function request(string $method, string $url, array $options = []): array
    {
        $this->calls[] = compact('method', 'url', 'options');
        if (!$this->responses) throw new RuntimeException('missing fake response');
        return array_shift($this->responses);
    }
}

$protocol = new FakeWeiboProtocol;
$assert($protocol->generateS('1234567890', '12DB195010') === 'b2470700', 'Weico 6.4.7 known s vector must match');
$media = $protocol->media(['abc_123-x']);
$assert(($media[0]['fid'] ?? null) === 'abc_123-x' && ($media[0]['bypass'] ?? null) === 'unistore.image', 'pid must become app media fid');
try { $protocol->media(range(1, 10)); $errors[] = 'ten images must be rejected'; } catch (InvalidArgumentException) {}

$classified = $protocol->classify(['errno' => '8513', 'errmsg' => 'limited'], 200);
$assert($classified['reason'] === WeiboReason::SmsCodeRequestLimitExceeded, '8513 must map strictly');
$classified = $protocol->classify(['errno' => '999999', 'errmsg' => 'new ambiguous error'], 200);
$assert($classified['reason'] === WeiboReason::Unknown, 'ambiguous errors must stay unknown');

$account = new WeiboAccount(['uid' => '1234567890', 'gsid' => 'plain-gsid', 'from_value' => '12DB195010', 'screen_name' => 'tester', 'cookie_json' => ['SUB' => 'plain-cookie']]);
$protocol->responses = [[['idstr' => '1234567890'], 200]];
$check = $protocol->check($account);
$assert($check['valid'] === true && count($protocol->calls) === 1, 'login check must use one read-only request');
foreach (['uid', 'from_value', 'gsid'] as $field) {
    foreach ([null, ''] as $missing) {
        $invalidAccount = new WeiboAccount(array_replace(['uid' => '1234567890', 'from_value' => '12DB195010', 'gsid' => 'fixture'], [$field => $missing]));
        $before = count($protocol->calls);
        $invalidCheck = $protocol->check($invalidAccount);
        $assert($invalidCheck['valid'] === false && $invalidCheck['reason'] === WeiboReason::LoginInvalid && count($protocol->calls) === $before, "missing {$field} must fail login locally without remote request");
    }
}

$assert($protocol->statusIdFromUrl('https://m.weibo.cn/detail/5178204587490145?refer_flag=1001030103_') === '5178204587490145', 'mobile detail URL must preserve its numeric status ID');
$assert($protocol->statusIdFromUrl('https://weibo.com/2996116492/z0JH2lOMb') === '3501756485200075', 'desktop status URL must decode the base62 bid');
foreach (['12345', 'https://example.com/123/AbC', 'https://weibo.com/u/12345'] as $invalidUrl) {
    try { $protocol->statusIdFromUrl($invalidUrl); $errors[] = "invalid status URL accepted: {$invalidUrl}"; } catch (InvalidArgumentException) {}
}

foreach ([
    ['post', [['idstr' => '10001'], 200], fn() => $protocol->post($account, ['display_tag' => '#x[超话]#', 'topic_id' => 'topic'], 'hello', [])],
    ['like', [['ok' => 1], 200], fn() => $protocol->like($account, '12345')],
    ['comment', [['idstr' => '20001'], 200], fn() => $protocol->comment($account, '12345', 'hello')],
    ['checkin', [['result' => '1', 'msg' => '签到成功'], 200], fn() => $protocol->checkin($account, ['container_id' => '100808' . str_repeat('a', 32)])],
] as [$name, $response, $call]) {
    $protocol->responses = [$response]; $before = count($protocol->calls); $call();
    $assert(count($protocol->calls) === $before + 1, "{$name} must issue exactly one remote write request");
}
$checkinCall = $protocol->calls[array_key_last($protocol->calls)];
$checkinQuery = $checkinCall['options']['query'] ?? [];
$assert($checkinCall['method'] === 'GET' && str_ends_with($checkinCall['url'], '/page/button'), 'check-in must use the app page/button request');
$assert(($checkinQuery['oldS'] ?? null) === 'b2470700' && ($checkinQuery['s'] ?? null) === 'b2470700', 'check-in must use the current local s as oldS');
$assert(str_contains($checkinQuery['request_url'] ?? '', 'active_checkin?pageid=100808'), 'check-in request_url must carry the supertopic pageid');
foreach ([
    ['388000', WeiboReason::CaptchaRequired],
    ['402003', WeiboReason::ServiceBusy],
    ['402004', WeiboReason::InteractionRequired],
] as [$code, $reason]) {
    $protocol->responses = [[['result' => $code, 'msg' => 'fixture'], 200]];
    $result = $protocol->checkin($account, ['container_id' => '100808' . str_repeat('b', 32)]);
    $assert($result['success'] === false && $result['reason'] === $reason && $result['code'] === $code, "check-in result {$code} must keep its precise reason");
}

$serialized = $account->toArray();
foreach (['phone', 'gsid', 'from_value', 'oauth_token', 'cookie_json', 'user_json'] as $field) $assert(!array_key_exists($field, $serialized), "{$field} must stay hidden from model serialization");

$root = dirname(__DIR__);
$schema = file_get_contents($root . '/sql/patches/20260825_weibo_application.sql');
foreach (['`phone` VARCHAR(32)', '`gsid` TEXT', '`from_value` VARCHAR(32)', '`oauth_token` TEXT', '`cookie_json` JSON', '`user_json` JSON'] as $plainColumn) $assert(str_contains($schema, $plainColumn), "plaintext schema column missing: {$plainColumn}");
$assert(!str_contains($schema, 'cipher') && !str_contains($schema, 'hmac') && !str_contains($schema, 'WEIBO_CREDENTIAL_SECRET'), 'Weibo schema must not introduce credential encryption');
$checkinPatch = file_get_contents($root . '/sql/patches/20260826_weibo_checkin_tasks.sql');
$fullSchema = file_get_contents($root . '/sql/schema.sql');
$assert(str_contains($checkinPatch, '`operation_type`') && str_contains($fullSchema, '`operation_type` TINYINT UNSIGNED NOT NULL DEFAULT 1'), 'check-in task type must exist in the patch and full schema');

$teamController = file_get_contents($root . '/app/weibo/controller/Team.php');
$personalController = file_get_contents($root . '/app/weibo/controller/Personal.php');
foreach (['post', 'like', 'comment', 'taskStart', 'taskResume'] as $abilityAction) $assert(str_contains($teamController, "'{$abilityAction}'") && str_contains($personalController, "'{$abilityAction}'"), "Ability boundary missing for {$abilityAction}");
foreach (['loginStart', 'loginConfirm', 'accountCheck', 'mediaUpload', 'taskCreate', 'taskEdit', 'taskPause', 'taskCancel'] as $unprotectedAction) $assert(!preg_match("/'Ability:weibo'[^;]+\\b{$unprotectedAction}\\b/s", $teamController), "{$unprotectedAction} must not require Ability");
$assert(str_contains($teamController, 'Permission:') && str_contains($teamController, 'WEIBO_TEAM_MANAGE'), 'Weibo team routes require the team management Permission');
$assert(str_contains($personalController, 'Permission:') && str_contains($personalController, 'WEIBO_PERSONAL_USE'), 'Weibo personal routes require the personal use Permission');
$permissionDictionary = file_get_contents($root . '/app/service/PermissionDictionary.php');
$assert(str_contains($permissionDictionary, 'WEIBO_TEAM_MANAGE') && str_contains($permissionDictionary, 'WEIBO_PERSONAL_USE'), 'Weibo publishes both workspace Permission keys');
$weiboPermissionPatch = file_get_contents($root . '/sql/patches/20260905_weibo_permissions.sql');
$assert(
    str_contains($weiboPermissionPatch, "'weibo.team.manage'")
        && str_contains($weiboPermissionPatch, "'weibo.personal.use'")
        && str_contains($weiboPermissionPatch, "`role`.`role_key` = 'owner'"),
    'existing owner roles receive both Weibo permissions without changing custom roles'
);

$workspace = file_get_contents($root . '/app/weibo/controller/WorkspaceController.php');
$assert(str_contains($workspace, "taskCreate(") && str_contains($workspace, '$this->teamScope() ? null : $request->entity_id'), 'team task creation must not create a personal task');
$assert(str_contains($workspace, "expected_entity_id/d"), 'personal writes must enforce expected_entity_id');
$assert(!str_contains($workspace, 'confirmation') && !str_contains($workspace, 'POST_ONCE') && !str_contains($workspace, 'LIKE_ONCE') && !str_contains($workspace, 'COMMENT_ONCE'), 'manual writes must not require typed confirmation words');
$assert(str_contains($workspace, "post('status_url/s'") && !str_contains($workspace, "post('status_id/s'"), 'manual interactions must accept a status URL instead of a status ID');
$openapi = file_get_contents($root . '/docs/dev/openapi/weibo.openapi.json');
$assert(!str_contains($openapi, 'confirmation') && !str_contains($openapi, 'POST_ONCE') && !str_contains($openapi, 'LIKE_ONCE') && !str_contains($openapi, 'COMMENT_ONCE'), 'manual write OpenAPI contract must not expose typed confirmation words');
$assert(str_contains($openapi, 'status_url') && !str_contains($openapi, 'statuses/{status_id}/images') && !str_contains($openapi, 'StatusId'), 'OpenAPI must accept status URLs and omit status image lookup');
$assert(str_contains($openapi, '"Checkin"') && str_contains($openapi, '"operation_type"'), 'OpenAPI must expose the automatic check-in task type');
$routes = file_get_contents($root . '/app/weibo/route/app.php');
$mediaLibrary = file_get_contents($root . '/app/service/WeiboMediaLibrary.php');
$protocolSource = file_get_contents($root . '/app/service/WeiboProtocol.php');
$assert(!str_contains($routes, 'statusImages') && !str_contains($mediaLibrary, 'importStatusImages') && !str_contains($protocolSource, 'statusImages'), 'status image lookup must not remain exposed');
$assert(!str_contains($schema, 'source_status_id'), 'media schema must not retain the removed status import field');

$tasks = file_get_contents($root . '/app/service/WeiboTasks.php');
$job = file_get_contents($root . '/app/job/RunWeiboTask.php');
$operations = file_get_contents($root . '/app/service/WeiboOperations.php');
foreach (['task_id', 'version', 'planned_at'] as $field) $assert(str_contains($tasks, "'{$field}'"), "queue payload missing {$field}");
$assert(str_contains($job, 'random_int(') && str_contains($job, "BlockedAbility") && str_contains($job, "BlockedLogin"), 'worker must randomize timing and preserve explicit blocked states');
$assert(str_contains($job, "new \\DateTimeImmutable('today')") && str_contains($job, 'WeiboTasks::CHECKIN_INTERVAL'), 'worker must prevent duplicate daily check-ins and schedule the next day');
$assert(str_contains($job, 'WeiboOperationType::Checkin') && str_contains($operations, '$protocol->checkin'), 'scheduled check-in must use the shared worker and operation boundary');
$assert(str_contains($job, "执行进程在远程请求后未回写结果") && str_contains($job, 'WeiboExecutionStatus::Unknown'), 'replayed dispatching operations must become unknown without reposting');
$assert(str_contains($operations, 'WeiboExecutionStatus::Dispatching') && str_contains($operations, 'Db::transaction') && str_contains($operations, '$protocol->post'), 'operation log must commit dispatching before the remote call');
$assert(!str_contains($operations, 'retry(') && !str_contains($operations, 'Queue::'), 'manual remote writes must not retry or enqueue themselves');

$typedBoundaryFiles = array_merge(
    glob($root . '/app/model/Weibo*.php') ?: [],
    glob($root . '/app/service/Weibo*.php') ?: [],
    glob($root . '/app/weibo/controller/*.php') ?: [],
    [$root . '/app/job/RunWeiboTask.php'],
);
// Targeted scheduler fixes retain all protocol cases and scan only their changed production files.
if (in_array('--scheduler-fix', $argv, true)) {
    $typedBoundaryFiles = [
        $root . '/app/service/WeiboAccounts.php',
        $root . '/app/service/WeiboProtocol.php',
        $root . '/app/job/RunWeiboTask.php',
    ];
}
foreach ($typedBoundaryFiles as $file) {
    $source = file_get_contents($file);
    $assert(!preg_match('/\((?:int|string|bool|float|array)\)\s*/', $source), basename($file) . ' must use request filters, model types, or explicit boundary validation instead of handwritten casts');
    $assert(!str_contains($source, "array_map('intval'") && !str_contains($source, 'intval('), basename($file) . ' must not hide integer conversion in helpers');
}
$assert(!str_contains($workspace, '$request->post()'), 'task writes must read explicitly typed request fields');

if ($errors) { fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL); exit(1); }
fwrite(STDOUT, "Weibo protocol and data-boundary tests passed\n");
