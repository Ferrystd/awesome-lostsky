<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\WeiboExecutionStatus;
use app\enum\WeiboReason;
use app\job\RunWeiboTask;
use app\model\TeamNotice;
use app\model\WeiboOperationLog;
use app\service\WeiboProtocol;
use think\facade\Db;

(new \think\App(dirname(__DIR__)))->initialize();
$errors = []; $assertions = 0;
$assert = static function (bool $condition, string $message) use (&$errors, &$assertions): void { $assertions++; if (!$condition) $errors[] = $message; };
$db = Db::connect(); $config = $db->getConfig();
if ($config['hostname'] !== '127.0.0.1' || $config['database'] !== 'lostsky') throw new RuntimeException('inflight fixtures require the verified local database');
$session = static fn() => new PDO('mysql:host=' . $config['hostname'] . ';port=' . $config['hostport'] . ';dbname=' . $config['database'], $config['username'], $config['password']);
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $user = new \app\model\User;
    $user->save(['phone' => '15' . random_int(100000000, 999999999), 'username' => 'inflight-' . $suffix, 'password' => password_hash('fixture', PASSWORD_DEFAULT)]);
    $team = new \app\model\Team; $team->save(['slug' => 'inflight-' . $suffix, 'user_id' => $user->id]);
    $entity = new \app\model\Entity; $entity->save(['entityable_type' => 'team', 'entityable_id' => $team->id, 'slug' => 'inflight-' . $suffix]);
    (new \app\model\TeamAbility)->save(['team_id' => $team->id, 'ability_key' => 'weibo', 'level' => 1, 'expire_time' => 0]);
    $accountId = Db::name('weibo_account')->insertGetId(['phone' => '14' . random_int(100000000, 999999999), 'uid' => 'inflight-' . $suffix, 'gsid' => 'fixture', 'from_value' => '12DB195010', 'screen_name' => 'fixture']);
    (new \app\model\WeiboAccountBinding)->save(['team_id' => $team->id, 'entity_id' => $entity->id, 'account_id' => $accountId]);
    $task = new \app\model\WeiboTask;
    $task->save(['team_id' => $team->id, 'creator_entity_id' => $entity->id, 'operation_type' => 1, 'topic_name' => 'fixture', 'container_id' => '100808' . str_repeat('a', 32), 'topic_id' => str_repeat('a', 32), 'display_tag' => '#fixture[超话]#', 'content' => 'fixture', 'start_at' => time(), 'next_run_at' => time() - 10, 'min_interval' => 3600, 'max_interval' => 3600, 'status' => 2, 'version' => 1]);
    (new \app\model\WeiboTaskAccount)->save(['task_id' => $task->id, 'account_id' => $accountId]);
    $task->refresh();
    $protocol = new class extends WeiboProtocol {
        public int $checks = 0; public int $writes = 0; public bool $unknown = false; public bool $checkThrows = false;
        public function check(\app\model\WeiboAccount $account): array { $this->checks++; if ($this->checkThrows) throw new RuntimeException('fixture check failure'); return ['valid' => true]; }
        public function post(\app\model\WeiboAccount $account, array $topic, string $content, array $pids = []): array {
            $this->writes++; if ($this->unknown) throw new RuntimeException('fixture unknown write');
            return ['success' => true, 'reason' => WeiboReason::Ok, 'code' => null, 'message' => 'fixture', 'http_status' => 200, 'status_id' => 'fixture'];
        }
    };
    app()->instance(WeiboProtocol::class, $protocol);
    $jobFactory = static fn() => new class extends \think\queue\Job {
        public array $releases = [];
        public int $attemptCount = 1;
        public function __construct() {}
        public function getJobId() { return 'inflight-fixture'; }
        public function attempts() { return $this->attemptCount; }
        public function getRawBody() { return '{}'; }
        public function release($delay = 0) { $this->releases[] = $delay; parent::release($delay); }
    };
    $worker = new RunWeiboTask;
    $payload = static fn() => ['task_id' => $task->id, 'version' => $task->version, 'planned_at' => $task->next_run_at];
    $key = static fn(array $data) => "task:{$data['task_id']}:v{$data['version']}:at{$data['planned_at']}";
    $lockName = 'weibo_task:' . substr(hash('sha256', $config['database']), 0, 16) . ':' . $task->id;
    $data = $payload(); $log = new WeiboOperationLog;
    $log->save(['dispatch_key' => $key($data), 'team_id' => $team->id, 'task_id' => $task->id, 'task_version' => $task->version, 'operation_type' => 1, 'source' => 2, 'status' => WeiboExecutionStatus::Dispatching->value, 'started_at' => time()]);
    $holder = $session(); $hold = $holder->prepare('SELECT GET_LOCK(?, 0)'); $hold->execute([$lockName]);
    $assert((int) $hold->fetchColumn() === 1, 'live worker session acquires task lock');
    foreach ([$data, array_replace($data, ['version' => 2, 'planned_at' => time()])] as $delivery) {
        $job = $jobFactory(); $worker->fire($job, $delivery);
        $assert($job->releases === [30] && !$job->isDeleted(), 'inflight duplicate across cycles is delayed');
    }
    $assert($log->refresh()->enumCase('status') === WeiboExecutionStatus::Dispatching && $task->refresh()->next_run_at === $data['planned_at'], 'inflight log and schedule remain unchanged');
    $assert($protocol->checks === 0 && $protocol->writes === 0 && TeamNotice::where('team_id', $team->id)->count() === 0, 'inflight duplicate does not check, write or notify');
    $hold = null; $holder = null; // Session close, as after worker death.
    $worker->fire($jobFactory(), $data);
    $assert($log->refresh()->enumCase('status') === WeiboExecutionStatus::Unknown && $protocol->writes === 0, 'lost worker recovers unknown without repeating its write');
    $assert($task->refresh()->next_run_at > $data['planned_at'], 'lost worker advances schedule after acquiring released lock');
    $assert(TeamNotice::where('dedup_key', "weibo:operation:{$log->id}:unknown")->value('title') === '微博任务结果未确认', 'lost worker sends unknown notice');
    $worker->fire($jobFactory(), $data);
    $assert($protocol->writes === 0, 'old recovered delivery cannot write again');
    $task->save(['next_run_at' => time() - 20]); $data = $payload();
    $worker->fire($jobFactory(), $data);
    $assert($protocol->writes === 1 && WeiboOperationLog::where('dispatch_key', $key($data))->find()->enumCase('status') === WeiboExecutionStatus::Succeeded, 'normal next cycle writes once and succeeds');
    $assert($task->refresh()->next_run_at > time(), 'normal cycle schedules its next job');
    $task->save(['next_run_at' => time() - 30]); $data = $payload(); $protocol->unknown = true;
    $worker->fire($jobFactory(), $data); $unknownLog = WeiboOperationLog::where('dispatch_key', $key($data))->find();
    $assert($unknownLog->enumCase('status') === WeiboExecutionStatus::Unknown && TeamNotice::where('dedup_key', "weibo:operation:{$unknownLog->id}:unknown")->value('title') === '微博任务结果未确认', 'remote exception sends unknown notice');
    $assert(!TeamNotice::where('team_id', $team->id)->where('title', '微博任务执行失败')->find(), 'unknown results never send failed notice');
    $probeReleased = static function () use ($session, $lockName, $assert): void {
        $probe = $session(); $statement = $probe->prepare('SELECT GET_LOCK(?, 0)'); $statement->execute([$lockName]);
        $assert((int) $statement->fetchColumn() === 1, 'independent session can acquire lock after completion or exception');
    };
    $probeReleased();
    $task->refresh(); $task->save(['next_run_at' => time() - 40]); $data = $payload(); $protocol->checkThrows = true;
    $job = $jobFactory(); $writes = $protocol->writes; $worker->fire($job, $data);
    $assert($job->releases === [60] && $protocol->writes === $writes && $task->refresh()->next_run_at === $data['planned_at'], 'unexpected check failure backs off without advancing or writing');
    $probeReleased();
    $abnormalNoticeCount = TeamNotice::where('dedup_key', "weibo:task:{$task->id}:abnormal:v{$task->version}")->count();
    foreach ([2 => 120, 5 => 900, PHP_INT_MAX => 900] as $attempts => $delay) {
        $job = $jobFactory(); $job->attemptCount = $attempts; $worker->fire($job, $data);
        $assert($job->releases === [$delay], 'unexpected errors use bounded exponential backoff');
    }
    $assert($abnormalNoticeCount === 1 && TeamNotice::where('dedup_key', "weibo:task:{$task->id}:abnormal:v{$task->version}")->count() === 1, 'abnormal retry notice is deduplicated per task version');
    $originalNotice = app(\app\service\Notice::class);
    app()->instance(\app\service\Notice::class, new class extends \app\service\Notice {
        public function sendOnce(int $teamId, string $title, ?string $content, string $dedupKey): array { throw new RuntimeException('fixture notice failure'); }
    });
    try {
        $job = $jobFactory(); $worker->fire($job, $data);
        $assert($job->releases === [60], 'notice failure after abnormal retry releases the job only once');
    } finally { app()->instance(\app\service\Notice::class, $originalNotice); }
    // Configuration rejection and actual GET_LOCK query failure must not fail open or hot loop.
    $property = new ReflectionProperty($db, 'config'); $originalConfig = $property->getValue($db);
    $linksProperty = new ReflectionProperty($db, 'links'); $originalLinks = $linksProperty->getValue($db);
    try {
        $property->setValue($db, array_replace($originalConfig, ['break_reconnect' => true]));
        $job = $jobFactory(); $worker->fire($job, $data);
        $assert($job->releases === [60] && $protocol->writes === $writes, 'unsafe connection configuration rejects with backoff');
        $property->setValue($db, $originalConfig);
        $failedPdo = new class('mysql:host=' . $config['hostname'] . ';port=' . $config['hostport'] . ';dbname=' . $config['database'], $config['username'], $config['password']) extends PDO {
            public function prepare(string $query, array $options = []): PDOStatement|false { throw new PDOException('fixture GET_LOCK query failure'); }
        };
        $linksProperty->setValue($db, array_replace($originalLinks, [0 => $failedPdo]));
        $job = $jobFactory(); $worker->fire($job, $data);
        $assert($job->releases === [60] && $protocol->writes === $writes, 'GET_LOCK query exception backs off without remote write');
    } finally { $property->setValue($db, $originalConfig); $linksProperty->setValue($db, $originalLinks); }
} catch (Throwable $exception) {
    $errors[] = get_class($exception) . ': ' . $exception->getMessage() . ' at ' . $exception->getFile() . ':' . $exception->getLine();
} finally {
    $hold = null; $holder = null;
    $db->rollback();
}
if ($errors) { fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL); exit(1); }
echo "Weibo inflight regression passed ({$assertions} assertions)\n";
