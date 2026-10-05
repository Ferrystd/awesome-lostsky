<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\Dedup;
use app\model\ApiRequestCache;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertThrows = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HttpException {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: expected {$status}, got {$exception->getStatusCode()}";
        }
    } catch (Throwable $exception) {
        $failures[] = "{$case}: expected HttpException {$status}, got " . $exception::class;
    }
};
$request = static function (string $path, ?string $requestId = null): Request {
    $request = (new Request)
        ->withServer([
            'REQUEST_METHOD' => 'POST',
            'REQUEST_URI' => $path,
            'HTTP_HOST' => 'api.lostsky.work',
        ])
        ->withPost(['value' => 'same']);
    $headers = ['Authorization' => 'Bearer dedup-test-principal'];
    if ($requestId !== null) {
        $headers['X-Request-Id'] = $requestId;
    }
    return $request->withHeader($headers);
};

$db = app()->db;
$db->startTrans();
try {
    $dedup = app(Dedup::class);
    $suffix = bin2hex(random_bytes(6));
    $success = static fn (Request $request) => success(['path' => $request->url()]);

    $withoutHeader = $request("/dedup/fallback/{$suffix}");
    $dedup->handle($withoutHeader, $success);
    $assertThrows(
        fn () => $dedup->handle($request("/dedup/fallback/{$suffix}"), $success),
        429,
        'unsafe request without client identifiers still receives server-side deduplication'
    );

    foreach ([null, "team-{$suffix}"] as $crossTeamId) {
        $first = $request("/role/add/{$suffix}", $crossTeamId); $first->team_id = 10001;
        $second = $request("/role/add/{$suffix}", $crossTeamId); $second->team_id = 10002;
        $dedup->handle($first, $success);
        $dedup->handle($second, $success);
        $assertThrows(fn () => $dedup->handle($first, $success), 429, 'same team still deduplicates after another team succeeds');
    }
    $requestId = "dedup-{$suffix}";
    $dedup->handle($request("/dedup/id/{$suffix}", $requestId), $success);
    $assertThrows(
        fn () => $dedup->handle($request("/dedup/id/{$suffix}", $requestId), $success),
        429,
        'same request identifier is rejected for the same principal and operation'
    );

    $failedId = "dedup-failed-{$suffix}";
    $failed = static fn (Request $request) => error('expected failure', 1, 422);
    $dedup->handle($request("/dedup/failure/{$suffix}", $failedId), $failed);
    $dedup->handle($request("/dedup/failure/{$suffix}", $failedId), $success);
    $assert(true, 'failed response releases the request hash for retry');

    $hashBuilder = new ReflectionMethod(Dedup::class, 'buildHash');
    $expiredRequest = $request("/dedup/expired/{$suffix}", "dedup-expired-{$suffix}");
    $dedup->handle($expiredRequest, $success);
    $hash = $hashBuilder->invoke(
        $dedup,
        $expiredRequest,
        '',
        "dedup-expired-{$suffix}"
    );
    ApiRequestCache::where('hash', $hash)->update([
        'create_time' => time() - (int) config('dedup.expire_seconds', 300) - 1,
    ]);
    $dedup->handle($request("/dedup/expired/{$suffix}", "dedup-expired-{$suffix}"), $success);
    $assert(
        strlen($hash) === 64 && ApiRequestCache::where('hash', $hash)->count() === 1,
        'expired SHA-256 hash is physically replaced without unique-key conflicts'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Dedup tests passed." . PHP_EOL);
