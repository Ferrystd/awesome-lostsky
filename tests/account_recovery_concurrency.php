<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\SmsType;
use app\model\User;
use app\service\AccountRecovery;
use think\App;
use think\exception\HttpException;
use think\facade\Cache;
use think\facade\Db;

(new App(dirname(__DIR__)))->initialize();
$auth = config('auth');
$auth['sms']['type'] = SmsType::AliyunSms;
$auth['sms']['debug_bypass'] = false;
app()->config->set($auth, 'auth');
app()->debug(false);

if (($argv[1] ?? '') === '--worker') {
    $input = json_decode(file_get_contents($argv[2]), true);
    file_put_contents($input['barrier'] . '.ready-' . $argv[3], 'ready');
    $deadline = microtime(true) + 15;
    while (!is_file($input['barrier']) && microtime(true) < $deadline) usleep(10_000);
    try {
        if ($input['operation'] === 'verify') app(AccountRecovery::class)->verify($input['phone'], '123456');
        else app(AccountRecovery::class)->password($input['token'], 'concurrent-password');
        fwrite(STDOUT, "OK\n");
    } catch (HttpException $exception) {
        fwrite(STDOUT, 'ERR ' . $exception->getStatusCode() . "\n");
    } catch (Throwable $exception) {
        fwrite(STDERR, $exception::class . "\n"); exit(1);
    }
    exit(0);
}

$suffix = 'account-recovery-race-' . bin2hex(random_bytes(6));
$directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $suffix;
mkdir($directory, 0700);
$user = null;
$failures = [];
$count = 0;
$assert = static function (bool $condition, string $case) use (&$failures, &$count): void {
    ++$count;
    if (!$condition) $failures[] = $case;
};
$race = static function (array $input) use ($directory, $assert): array {
    $barrier = $directory . DIRECTORY_SEPARATOR . 'barrier';
    if (is_file($barrier)) unlink($barrier);
    foreach (glob($barrier . '.ready-*') ?: [] as $ready) unlink($ready);
    $input['barrier'] = $barrier;
    $fixture = $directory . DIRECTORY_SEPARATOR . 'input.json';
    file_put_contents($fixture, json_encode($input));
    $processes = [];
    for ($index = 0; $index < 2; ++$index) {
        // The credential stays in a scoped fixture, never appears on a process command line.
        $process = proc_open([PHP_BINARY, __FILE__, '--worker', $fixture, (string) $index], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) throw new RuntimeException('cannot start concurrency worker');
        $processes[] = [$process, $pipes];
    }
    $deadline = microtime(true) + 10;
    while (count(glob($barrier . '.ready-*') ?: []) !== 2 && microtime(true) < $deadline) usleep(10_000);
    if (count(glob($barrier . '.ready-*') ?: []) !== 2) {
        foreach ($processes as [$process, $pipes]) {
            proc_terminate($process);
            fclose($pipes[1]); fclose($pipes[2]); proc_close($process);
        }
        throw new RuntimeException('workers did not both become ready before deadline');
    }
    $assert(true, 'both independent workers are ready before simultaneous release');
    file_put_contents($barrier, 'go');
    $results = [];
    foreach ($processes as [$process, $pipes]) {
        $results[] = trim(stream_get_contents($pipes[1]));
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        $assert(proc_close($process) === 0 && $stderr === '', 'independent worker exits cleanly');
    }
    sort($results);
    return $results;
};
try {
    $user = new User;
    $phone = '19' . random_int(100000000, 999999999);
    $user->save(['phone' => $phone, 'username' => $suffix, 'password' => password_hash('before-password', PASSWORD_DEFAULT)]);
    $smsKey = 'auth_sms_code_' . hash('sha256', 'recovery|' . $phone);
    Cache::set($smsKey, ['type' => SmsType::AliyunSms->value, 'code_hash' => password_hash('123456', PASSWORD_DEFAULT), 'attempts' => 0, 'expires_at' => time() + 300], 300);
    $results = $race(['operation' => 'verify', 'phone' => $phone]);
    $assert($results === ['ERR 422', 'OK'], 'same original-phone SMS issues exactly one recovery credential across independent workers');
    $assert(!Cache::has($smsKey), 'successful concurrent SMS verification cannot revive the code record');
    $token = $user->id . '.' . bin2hex(random_bytes(32));
    Cache::set('account_recovery_' . $user->id, ['hash' => hash('sha256', $token), 'version' => hash('sha256', $phone . '|' . $user->password), 'generation' => Cache::get('account_recovery_generation_' . $user->id), 'expires_at' => time() + 600], 600);
    $results = $race(['operation' => 'password', 'token' => $token]);
    $assert($results === ['ERR 410', 'OK'], 'same recovery credential completes exactly once across independent workers');
    $assert(password_verify('concurrent-password', (string) User::find($user->id)->password), 'winning mutation is committed');
    $assert(!Cache::has('account_recovery_' . $user->id), 'winning mutation clears credential digest');
} finally {
    if ($user) {
        Cache::delete('account_recovery_' . $user->id);
        Cache::delete('account_recovery_generation_' . $user->id);
        Cache::delete('auth_sms_code_' . hash('sha256', 'recovery|' . $user->phone));
        Db::table('user')->where('id', $user->id)->delete();
        $assert(Db::table('user')->where('id', $user->id)->count() === 0, 'committed concurrency fixture is fully cleaned');
    }
    foreach (glob($directory . DIRECTORY_SEPARATOR . '*') ?: [] as $file) unlink($file);
    rmdir($directory);
}
if ($failures) { fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL); exit(1); }
fwrite(STDOUT, "Account recovery concurrency passed ({$count} assertions; two independent real DB workers).\n");
