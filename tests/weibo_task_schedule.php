<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\WeiboReason;
use app\model\WeiboAccount;
use app\service\WeiboProtocol;
use think\App;

(new App(dirname(__DIR__)))->initialize();

$errors = []; $assertions = 0;
$assert = static function (bool $condition, string $message) use (&$errors, &$assertions): void { $assertions++; if (!$condition) $errors[] = $message; };

final class FakeWeiboProtocol extends WeiboProtocol
{
    public array $responses = [];
    public array $calls = [];
    public ?Closure $onRequest = null;
    protected function request(string $method, string $url, array $options = []): array
    {
        $this->calls[] = compact('method', 'url', 'options');
        if ($this->onRequest) ($this->onRequest)();
        if (!$this->responses) throw new RuntimeException('missing fake response');
        return array_shift($this->responses);
    }
}

// Real ORM/queue regression fixtures are isolated by an outer rollback transaction.
$db = \think\facade\Db::connect();
if ($db->getConfig('hostname') !== '127.0.0.1' || $db->getConfig('database') !== 'lostsky') throw new RuntimeException('scheduler fixtures require the verified local database');
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $user = new \app\model\User;
    $user->save(['phone' => '15' . random_int(100000000, 999999999), 'username' => 'weibo-task-' . $suffix, 'password' => password_hash('test-only', PASSWORD_DEFAULT)]);
    $team = new \app\model\Team;
    $team->save(['slug' => 'weibo-task-' . $suffix, 'user_id' => $user->id]);
    $entity = new \app\model\Entity;
    $entity->save(['entityable_type' => 'team', 'entityable_id' => $team->id, 'slug' => 'weibo-task-' . $suffix]);
    (new \app\model\TeamAbility)->save(['team_id' => $team->id, 'ability_key' => 'weibo', 'level' => 1, 'expire_time' => 0]);
    $accountId = \think\facade\Db::name('weibo_account')->insertGetId(['phone' => '14' . random_int(100000000, 999999999), 'uid' => 'test-' . $suffix, 'gsid' => 'test-only', 'from_value' => '12DB195010', 'screen_name' => 'fixture']);
    $account = WeiboAccount::find($accountId);
    $assert($account->publicSummary()['health'] === 'Unchecked', 'persisted account summary reads the health enum');
    (new \app\model\WeiboAccountBinding)->save(['team_id' => $team->id, 'entity_id' => $entity->id, 'account_id' => $account->id]);
    $loginProtocol = new FakeWeiboProtocol;
    $loginProtocol->responses = [[['idstr' => $account->uid], 200]];
    app()->instance(WeiboProtocol::class, $loginProtocol);
    $originalSms = app(\app\service\SmsVerification::class);
    $fakeSms = new class extends \app\service\SmsVerification {
        public array $calls = [];
        public function send(string $phone, string $purpose): array
        {
            $this->calls[] = compact('phone', 'purpose');
            return ['expires_in' => 600];
        }
    };
    app()->instance(\app\service\SmsVerification::class, $fakeSms);
    try {
        $challenge = app(\app\service\WeiboAccounts::class)->start($team->id, $entity->id, $account->getData('phone'));
        $assert($challenge['kind'] === 'lostsky' && count($fakeSms->calls) === 1 && count($loginProtocol->calls) === 1, 'existing valid account login start preserves the LostSky SMS verification rule');
        $assert(WeiboAccount::find($accountId)->publicSummary()['health'] === 'Valid', 'login start persists valid health and summary preserves enum names');
        \think\facade\Cache::delete('weibo_login_challenge:' . $challenge['challenge_id']);
    } finally {
        app()->instance(\app\service\SmsVerification::class, $originalSms);
    }
    $task = new \app\model\WeiboTask;
    $task->save(['team_id' => $team->id, 'creator_entity_id' => $entity->id, 'operation_type' => 1, 'topic_name' => 'fixture', 'container_id' => '100808' . str_repeat('a', 32), 'topic_id' => str_repeat('a', 32), 'display_tag' => '#fixture[超话]#', 'content' => 'fixture', 'start_at' => time(), 'min_interval' => 3600, 'max_interval' => 3600, 'status' => 1, 'version' => 1]);
    (new \app\model\WeiboTaskAccount)->save(['task_id' => $task->id, 'account_id' => $account->id]);
    $tasksService = app(\app\service\WeiboTasks::class);
    $worker = new \app\job\RunWeiboTask;
    $jobFactory = static fn() => new class extends \think\queue\Job {
        public array $releases = [];
        public function __construct() {}
        public function release($delay = 0) { $this->releases[] = $delay; parent::release($delay); }
        public function getJobId() { return 'weibo-fixture'; }
        public function attempts() { return 1; }
        public function getRawBody() { return '{}'; }
    };
    $payload = static fn($row) => ['task_id' => $row->id, 'version' => $row->version, 'planned_at' => $row->next_run_at];
    $queue = \think\facade\Queue::connection('database');
    $tableProperty = new ReflectionProperty($queue, 'table');
    $queueTable = $tableProperty->getValue($queue);
    // A failed jobs INSERT must roll back the Active transition too.
    $tableProperty->setValue($queue, 'missing_weibo_queue_fixture');
    try { $tasksService->transition($team->id, $entity->id, $task->id, true, 'start'); $errors[] = 'queue failure must throw'; }
    catch (\Throwable $exception) {}
    finally { $tableProperty->setValue($queue, $queueTable); }
    $task->refresh();
    $assert($task->enumCase('status') === \app\enum\WeiboTaskStatus::Paused && $task->version === 1 && !$task->next_run_at, 'failed enqueue must leave the original paused task');
    foreach (['pause', 'cancel', 'resume'] as $action) {
        // Reset only the fixture between scenarios.
        $task->save(['status' => 1, 'next_run_at' => null]);
        $tasksService->transition($team->id, $entity->id, $task->id, true, 'start');
        $task->refresh(); $data = $payload($task);
        $fake = new FakeWeiboProtocol;
        $fake->responses = [[['idstr' => $account->uid], 200]];
        $fake->onRequest = static function () use ($tasksService, $team, $entity, $task, $action): void {
            $tasksService->transition($team->id, $entity->id, $task->id, true, $action);
        };
        app()->instance(WeiboProtocol::class, $fake);
        $worker->fire($jobFactory(), $data);
        $current = \app\model\WeiboTask::find($task->id);
        $assert(count($fake->calls) === 1 && $current->version === $data['version'] + 1, "{$action} during login check must stop the old write and preserve new version");
    }
    $task->save(['status' => 1, 'next_run_at' => null]);
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'start');
    $task->refresh(); $data = $payload($task);
    $staleData = $data;
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume');
    $task->refresh(); $data = $payload($task);
    $staleProtocol = new FakeWeiboProtocol;
    app()->instance(WeiboProtocol::class, $staleProtocol);
    try {
        app(\app\service\WeiboOperations::class)->execute($team->id, null, null, $account->id, \app\enum\WeiboOperationType::Post,
            ['topic' => ['name' => 'fixture', 'topic_id' => str_repeat('a', 32), 'container_id' => '100808' . str_repeat('a', 32), 'display_tag' => '#fixture[超话]#'], 'content' => 'fixture'],
            \app\enum\WeiboOperationSource::Schedule, $task->id, $staleData['version'], "task:{$task->id}:v{$staleData['version']}:at{$staleData['planned_at']}", $staleData['planned_at']);
        $errors[] = 'stale dispatch claim must be rejected';
    } catch (\think\exception\HttpException $exception) {
        $assert($exception->getStatusCode() === 409 && !$staleProtocol->calls, 'dispatch claim rechecks the task before writing remotely');
    }
    $fake = new FakeWeiboProtocol;
    $fake->responses = [[['idstr' => $account->uid], 200], [['idstr' => 'fixture-post'], 200]];
    $expectedNext = null;
    $fake->onRequest = static function () use ($fake, $tasksService, $team, $entity, $task, &$expectedNext): void {
        if (count($fake->calls) !== 2) return;
        $tasksService->transition($team->id, $entity->id, $task->id, true, 'pause');
        $expectedNext = $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume');
    };
    app()->instance(WeiboProtocol::class, $fake);
    $worker->fire($jobFactory(), $data);
    $current = \app\model\WeiboTask::find($task->id);
    $assert(count($fake->calls) === 2 && $current->version === $expectedNext['version'] && $current->next_run_at === $expectedNext['next_run_at'], 'old worker completion must not overwrite resumed schedule');
    $assert(WeiboAccount::find($account->id)->enumCase('health') === \app\enum\WeiboAccountHealth::Valid, 'persisted account login health must update correctly');
    // Simulate failure after remote dispatch; schedule rollback keeps the original key for safe retry.
    $task->refresh(); $data = $payload($task);
    $fake = new FakeWeiboProtocol;
    $fake->responses = [[['idstr' => $account->uid], 200], [['idstr' => 'fixture-post-2'], 200]];
    $fake->onRequest = static function () use ($fake, $tableProperty, $queue): void {
        if (count($fake->calls) === 2) $tableProperty->setValue($queue, 'missing_weibo_queue_fixture');
    };
    app()->instance(WeiboProtocol::class, $fake);
    $failedJob = $jobFactory();
    try { $worker->fire($failedJob, $data); }
    finally { $tableProperty->setValue($queue, $queueTable); }
    $task->refresh();
    $assert($task->next_run_at === $data['planned_at'], 'failed next enqueue rolls back planned time');
    $assert($failedJob->releases === [60], 'failed next enqueue safely backs off');
    $before = count($fake->calls);
    $worker->fire($jobFactory(), $data);
    $assert(count($fake->calls) === $before, 'retry after scheduling failure must not repeat remote write');
    $task->refresh();
    // Remove only fixture jobs, then verify recovery deduplication and unknown handling.
    \think\facade\Db::name($queueTable)->where('queue', \app\service\WeiboTasks::QUEUE)->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.task_id')) = ?", [$task->id])->delete();
    $assert($tasksService->recover($task->id) === 1 && $tasksService->recover($task->id) === 0, 'recovery restores one missing job and is idempotent');
    \think\facade\Db::name($queueTable)->where('queue', \app\service\WeiboTasks::QUEUE)
        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.task_id')) = ?", [$task->id])->update(['reserve_time' => time()]);
    $assert($tasksService->recover($task->id) === 0, 'recovery must preserve already reserved jobs');
    $data = $payload($task);
    $log = new \app\model\WeiboOperationLog;
    $log->save(['dispatch_key' => "task:{$task->id}:v{$task->version}:at{$task->next_run_at}", 'team_id' => $team->id, 'task_id' => $task->id, 'task_version' => $task->version, 'operation_type' => 1, 'source' => \app\enum\WeiboOperationSource::Schedule->value, 'status' => \app\enum\WeiboExecutionStatus::Dispatching->value, 'started_at' => time()]);
    $worker->fire($jobFactory(), $data);
    $assert($log->refresh()->enumCase('status') === \app\enum\WeiboExecutionStatus::Unknown && count($fake->calls) === $before, 'recovered dispatching becomes unknown without another remote write');
    // A task referencing a deleted (unbound) account must block, not spin forever.
    // Each fixture cycle needs a distinct planned time even when executed in the same second.
    $task->refresh(); $task->save(['next_run_at' => time() - 10]); $data = $payload($task);
    $staleBinding = \app\model\WeiboAccountBinding::where('team_id', $team->id)->where('account_id', $account->id)->find();
    $staleBinding->delete();
    $spinProtocol = new FakeWeiboProtocol;
    app()->instance(WeiboProtocol::class, $spinProtocol);
    $worker->fire($jobFactory(), $data);
    $task->refresh();
    $assert($task->enumCase('status') === \app\enum\WeiboTaskStatus::BlockedLogin && $task->block_reason === 'all_accounts_invalid' && $task->version === $data['version'] + 1, 'task whose candidates are all unbound blocks as invalid login instead of dispatching');
    $assert(!$spinProtocol->calls && !\app\model\WeiboOperationLog::where('dispatch_key', "task:{$task->id}:v{$data['version']}:at{$data['planned_at']}")->find(), 'unbound-only selection performs no remote call and writes no dispatch log');
    // Unbinding an account must immediately block the active tasks that only reference it through this binding.
    $binding = \app\model\WeiboAccountBinding::withTrashed()->where('team_id', $team->id)->where('account_id', $account->id)->find();
    $binding->restore();
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume');
    $task->refresh();
    $versionBeforeUnbind = $task->version;
    app(\app\service\WeiboAccounts::class)->unbind($team->id, $entity->id, (int) $binding->id, true);
    $task->refresh();
    $assert(\app\model\WeiboAccountBinding::withTrashed()->find($binding->id)->delete_time !== null, 'unbind deletes the binding');
    $assert($task->enumCase('status') === \app\enum\WeiboTaskStatus::BlockedLogin && $task->block_reason === 'account_unbound' && $task->version === $versionBeforeUnbind + 1 && !$task->next_run_at, 'unbind immediately blocks the referencing active task with account_unbound');
    $assert(!\think\facade\Db::name($queueTable)->where('queue', \app\service\WeiboTasks::QUEUE)
        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.task_id')) = ?", [$task->id])
        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(payload, '$.data.version')) = ?", [$task->version])->find(), 'unbind schedules no further jobs for the blocked task');
    // Missing credentials block only when no healthy candidate remains.
    $binding->restore(); \think\facade\Db::name('weibo_account')->where('id', $account->id)->update(['gsid' => '']);
    $assert(WeiboAccount::find($account->id)->getData('gsid') === '', 'fixture persists empty credential');
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume');
    $task->refresh(); $data = $payload($task);
    $invalidProtocol = new FakeWeiboProtocol; app()->instance(WeiboProtocol::class, $invalidProtocol);
    $worker->fire($jobFactory(), $data);
    $assert($task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::BlockedLogin && !$invalidProtocol->calls, 'all missing-credential candidates block without remote requests');
    \think\facade\Db::name('weibo_account')->where('id', $account->id)->update(['gsid' => 'test-only']);
    $badAccountId = \think\facade\Db::name('weibo_account')->insertGetId(['phone' => '14' . random_int(100000000, 999999999), 'uid' => 'bad-' . $suffix, 'gsid' => '', 'from_value' => '', 'screen_name' => 'invalid fixture']);
    (new \app\model\WeiboAccountBinding)->save(['team_id' => $team->id, 'entity_id' => $entity->id, 'account_id' => $badAccountId]);
    (new \app\model\WeiboTaskAccount)->save(['task_id' => $task->id, 'account_id' => $badAccountId]);
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume');
    $task->refresh(); $data = $payload($task);
    $mixedProtocol = new FakeWeiboProtocol; $mixedProtocol->responses = [[['idstr' => $account->uid], 200], [['idstr' => 'mixed-fixture'], 200]];
    app()->instance(WeiboProtocol::class, $mixedProtocol); $worker->fire($jobFactory(), $data);
    $mixedLog = \app\model\WeiboOperationLog::where('dispatch_key', "task:{$task->id}:v{$data['version']}:at{$data['planned_at']}")->find();
    $assert($mixedLog->enumCase('status') === \app\enum\WeiboExecutionStatus::Succeeded && $mixedLog->account_id === $account->id && count($mixedProtocol->calls) === 2, 'mixed invalid and healthy candidates use only the healthy account');
    // Team scope accepts another binding of this account; personal scope requires its owner binding.
    $otherEntity = new \app\model\Entity; $otherEntity->save(['entityable_type' => 'user', 'entityable_id' => $user->id, 'slug' => 'weibo-other-' . $suffix]);
    $otherBinding = new \app\model\WeiboAccountBinding; $otherBinding->save(['team_id' => $team->id, 'entity_id' => $otherEntity->id, 'account_id' => $account->id]); $otherBinding->refresh();
    foreach (['unknown' => '999999', 'invalid' => '21314'] as $case => $code) {
        $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume'); $task->refresh();
        $task->save(['next_run_at' => time() - ($case === 'unknown' ? 20 : 30)]); $data = $payload($task);
        $multiBindingProtocol = new FakeWeiboProtocol; $multiBindingProtocol->responses = [[['errno' => $code, 'errmsg' => 'fixture'], 200], [['errno' => $code, 'errmsg' => 'fixture'], 200]];
        app()->instance(WeiboProtocol::class, $multiBindingProtocol); $worker->fire($jobFactory(), $data);
        $assert(count($multiBindingProtocol->calls) === 1, "multiple bindings check the same {$case} account only once");
    }
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume');
    $task->refresh(); $teamVersion = $task->version;
    app(\app\service\WeiboAccounts::class)->unbind($team->id, $entity->id, $binding->id, true);
    $assert($task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::Active && $task->version === $teamVersion, 'team task continues while its referenced account has another team binding');
    $binding->restore(); $task->save(['owner_entity_id' => $entity->id]);
    app(\app\service\WeiboAccounts::class)->unbind($team->id, $entity->id, $binding->id, false);
    $assert($task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::BlockedLogin && $task->block_reason === 'account_unbound', 'personal task blocks when its owner binding disappears despite another owner or other candidate');
    $tasksService->transition($team->id, $entity->id, $task->id, false, 'resume'); $task->refresh(); $data = $payload($task);
    $ownerProtocol = new FakeWeiboProtocol; app()->instance(WeiboProtocol::class, $ownerProtocol); $worker->fire($jobFactory(), $data);
    $assert(!$ownerProtocol->calls && $task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::BlockedLogin, 'personal candidate filtering never borrows another entity binding');
    $binding->restore(); $task->save(['owner_entity_id' => null, 'status' => \app\enum\WeiboTaskStatus::Paused->value, 'next_run_at' => null]);
    $pausedVersion = $task->version;
    app(\app\service\WeiboAccounts::class)->unbind($team->id, $entity->id, $binding->id, true);
    $assert($task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::Paused && $task->version === $pausedVersion, 'unbind preserves paused task status and version');
    // A notification failure must roll back both the binding deletion and immediate task block.
    $binding->restore(); $otherBinding->delete();
    $tasksService->transition($team->id, $entity->id, $task->id, true, 'resume'); $task->refresh(); $beforeFailedUnbind = $task->version;
    $originalNotice = app(\app\service\Notice::class);
    app()->instance(\app\service\Notice::class, new class extends \app\service\Notice {
        public function sendOnce(int $teamId, string $title, ?string $content, string $dedupKey): array { throw new RuntimeException('fixture notice failure'); }
    });
    try { app(\app\service\WeiboAccounts::class)->unbind($team->id, $entity->id, $binding->id, true); $errors[] = 'unbind notice failure must throw'; }
    catch (RuntimeException $exception) { $assert($exception->getMessage() === 'fixture notice failure', 'unbind reports notification failure'); }
    finally { app()->instance(\app\service\Notice::class, $originalNotice); }
    $assert(\app\model\WeiboAccountBinding::find($binding->id) !== null && $task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::Active && $task->version === $beforeFailedUnbind, 'failed unbind notification rolls back binding deletion and task block');
    $data = $payload($task);
    $raceProtocol = new FakeWeiboProtocol; $raceProtocol->responses = [[['idstr' => $account->uid], 200]];
    $raceProtocol->onRequest = static function () use ($team, $entity, $binding): void { app(\app\service\WeiboAccounts::class)->unbind($team->id, $entity->id, $binding->id, true); };
    app()->instance(WeiboProtocol::class, $raceProtocol); $worker->fire($jobFactory(), $data);
    $assert(count($raceProtocol->calls) === 1 && $task->refresh()->enumCase('status') === \app\enum\WeiboTaskStatus::BlockedLogin && $task->version === $data['version'] + 1, 'unbind during login check stops the stale write and preserves immediate block');
    $assert(!\app\model\WeiboOperationLog::where('dispatch_key', "task:{$task->id}:v{$data['version']}:at{$data['planned_at']}")->find(), 'unbind before dispatch claim creates no remote operation');
} catch (Throwable $exception) {
    fwrite(STDERR, get_class($exception) . ": " . $exception->getMessage() . " at " . $exception->getFile() . ":" . $exception->getLine() . PHP_EOL);
    $errors[] = "scheduler regression aborted";
} finally {
    $db->rollback();
}

if ($errors) { fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL); exit(1); }
echo "Weibo task concurrency and atomic queue regression tests passed ({$assertions} assertions)\n";
