<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Team;
use app\model\TeamMember;
use app\model\User;
use app\service\MemberJoinCode;
use think\App;
use think\exception\HttpException;
use think\facade\Db;

(new App(dirname(__DIR__)))->initialize();

if (($argv[1] ?? '') === '--worker') {
    $teamId = (int) ($argv[2] ?? 0);
    $code = (string) ($argv[3] ?? '');
    $barrier = (string) ($argv[4] ?? '');
    $deadline = microtime(true) + 15;
    while (!is_file($barrier) && microtime(true) < $deadline) {
        usleep(10_000);
    }
    try {
        $memberId = app(MemberJoinCode::class)->addMember($teamId, $code);
        fwrite(STDOUT, "OK {$memberId}\n");
        exit(0);
    } catch (HttpException $exception) {
        fwrite(STDOUT, "ERR {$exception->getStatusCode()}\n");
        exit(0);
    } catch (Throwable $exception) {
        fwrite(STDOUT, "ERR 500 " . $exception::class . "\n");
        exit(1);
    }
}

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$suffix = 'join-concurrency-' . bin2hex(random_bytes(6));
$owner = null;
$target = null;
$teamIds = [];
$memberIds = [];
$workDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $suffix;
if (!mkdir($workDir, 0700, true) && !is_dir($workDir)) {
    fwrite(STDERR, "cannot create concurrency work directory\n");
    exit(1);
}

try {
    $owner = new User;
    $owner->save([
        'phone' => '19' . random_int(100000000, 999999999),
        'username' => "{$suffix}-owner",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    $target = new User;
    $target->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'username' => "{$suffix}-target",
        'password' => 'join-code-test',
        'is_banned' => 0,
    ]);
    for ($index = 1; $index <= 2; ++$index) {
        $team = new Team;
        $team->save([
            'slug' => "{$suffix}-team-{$index}",
            'user_id' => (int) $owner->id,
            'is_banned' => 0,
            'is_cancelled' => 0,
        ]);
        $teamIds[] = (int) $team->id;
    }
    $issued = app(MemberJoinCode::class)->issue((int) $target->id);
    $code = (string) $issued['code'];
    $barrier = $workDir . DIRECTORY_SEPARATOR . 'start';
    $script = __FILE__;
    $processes = [];
    foreach ($teamIds as $teamId) {
        $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($script)
            . ' --worker ' . escapeshellarg((string) $teamId)
            . ' ' . escapeshellarg($code) . ' ' . escapeshellarg($barrier);
        $pipes = [];
        $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) throw new RuntimeException('worker process could not start');
        $processes[] = [$process, $pipes];
    }
    file_put_contents($barrier, 'go');
    $results = [];
    foreach ($processes as [$process, $pipes]) {
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        $results[] = ['stdout' => trim($stdout), 'stderr' => trim($stderr), 'exit' => $exitCode];
    }

    $ok = array_values(array_filter($results, static fn (array $result): bool => str_starts_with($result['stdout'], 'OK ')));
    $conflict = array_values(array_filter($results, static fn (array $result): bool => $result['stdout'] === 'ERR 422'));
    $assert(count($ok) === 1 && count($conflict) === 1, 'two independent workers produce exactly one success and one 422 rejection');
    $members = TeamMember::where('user_id', (int) $target->id)->select()->all();
    $memberIds = array_map(static fn (TeamMember $member): int => (int) $member->id, $members);
    $assert(count($members) === 1, 'concurrent consumption creates exactly one member');
    $assert(User::find((int) $target->id)?->member_join_code_hash === null, 'successful concurrent consumption clears the code');
    foreach ($results as $result) {
        $assert($result['exit'] === 0 && $result['stderr'] === '', 'worker exits cleanly: ' . json_encode($result));
    }
} catch (Throwable $exception) {
    $failures[] = (string) $exception;
} finally {
    // Workers have committed independently, so remove only rows created by this run.
    $deleted = 0;
    if ($memberIds) {
        $entityIds = Db::table('entity')->where('entityable_type', 'teamMember')->whereIn('entityable_id', $memberIds)->column('id');
        if ($entityIds) $deleted += (int) Db::table('team_entity_profile')->whereIn('entity_id', $entityIds)->delete();
        $deleted += (int) Db::table('entity')->whereIn('id', $entityIds)->delete();
        $deleted += (int) Db::table('team_member_tenure')->whereIn('member_id', $memberIds)->delete();
        $deleted += (int) Db::table('team_member')->whereIn('id', $memberIds)->delete();
    }
    if ($teamIds) $deleted += (int) Db::table('team')->whereIn('id', $teamIds)->delete();
    if ($target) $deleted += (int) Db::table('user')->where('id', (int) $target->id)->delete();
    if ($owner) $deleted += (int) Db::table('user')->where('id', (int) $owner->id)->delete();
    foreach (glob($workDir . DIRECTORY_SEPARATOR . '*') ?: [] as $file) @unlink($file);
    @rmdir($workDir);
    fwrite(STDOUT, "Concurrency cleanup rows: {$deleted}" . PHP_EOL);
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
fwrite(STDOUT, "Member join code concurrency tests passed." . PHP_EOL);
