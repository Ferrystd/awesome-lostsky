<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\Cors;
use app\middleware\RequestLog;
use app\support\SystemLog;
use think\App;
use think\exception\Handle;
use think\exception\HttpException;
use think\Request;
use think\Response;

$root = dirname(__DIR__);
$logPath = $root . '/runtime/system-log-test-' . bin2hex(random_bytes(6));
$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};

$app = new App($root);
$app->initialize();
$config = config('log');
$config['level'] = [];
$config['channels']['file']['path'] = $logPath;
$config['channels']['file']['single'] = 'system';
$config['channels']['file']['max_files'] = 5;
$config['channels']['file']['realtime_write'] = true;
$app->config->set($config, 'log');
$app->log->forgetDriver();

try {
    app(SystemLog::class)->write('info', 'security.test', [
        'password' => 'plain-password',
        'message' => 'Authorization: Bearer plain-token',
        'url' => 'https://example.test/callback?secret=plain-secret&ok=1',
    ]);
    $app->log->record('plain application message', 'notice');

    $request = (new Request)
        ->setMethod('POST')
        ->setPathinfo('logging/test')
        ->setHost('api.lostsky.work')
        ->withHeader(['X-Request-Id' => 'request-test-123']);
    $request->team_id = 7;
    $request->authenticated_user_id = 11;
    $request->entity_id = 13;

    $response = app(RequestLog::class)->handle(
        $request,
        static fn (Request $request): Response => Response::create('', 'html', 204)
    );
    $assert($response->getCode() === 204, 'request middleware must preserve the response');
    $assert($request->request_id === 'request-test-123', 'valid client request id must be reused');

    $failedRequest = (new Request)
        ->setMethod('GET')
        ->setPathinfo('logging/failure')
        ->setHost('api.lostsky.work');
    $failedResponse = app(RequestLog::class)->handle(
        $failedRequest,
        static fn (Request $request): Response => app(Cors::class)->handle(
            $request,
            static fn (): never => throw new RuntimeException('provider failed with Bearer plain-exception-token')
        )
    );
    $assert($failedResponse->getCode() === 500, 'unhandled exceptions must keep the JSON 500 response');
    $assert(
        is_string($failedRequest->request_id) && preg_match('/^[a-f0-9]{32}$/', $failedRequest->request_id) === 1,
        'missing request id must receive a generated correlation id'
    );

    $logFile = $logPath . '/system.log';
    $beforeIgnored = is_file($logFile) ? count(file($logFile, FILE_SKIP_EMPTY_LINES)) : 0;
    app(Handle::class)->report(new HttpException(404, 'expected missing resource'));
    $afterIgnored = is_file($logFile) ? count(file($logFile, FILE_SKIP_EMPTY_LINES)) : 0;
    $assert($afterIgnored === $beforeIgnored, 'expected HTTP exceptions must not produce exception events');

    $app->log->save();
    $assert(is_file($logFile), 'structured log file must be created');
    $lines = is_file($logFile) ? file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) : [];
    $records = array_map(static fn (string $line): mixed => json_decode($line, true), $lines ?: []);
    $assert(
        count($records) >= 5 && !in_array(null, $records, true),
        'every log line must be a valid JSON object'
    );

    $events = array_column($records, 'event');
    $assert(in_array('security.test', $events, true), 'explicit system events must be recorded');
    $assert(in_array('application.message', $events, true), 'plain framework logs must remain structured');
    $assert(in_array('exception.unhandled', $events, true), 'unhandled exceptions must be reported');
    $assert(count(array_keys($events, 'http.request', true)) === 2, 'every tested HTTP request must have a summary');

    $requestRecord = current(array_filter(
        $records,
        static fn (array $record): bool => ($record['request_id'] ?? '') === 'request-test-123'
    ));
    $assert(
        is_array($requestRecord)
            && ($requestRecord['status'] ?? null) === 204
            && ($requestRecord['team_id'] ?? null) === 7
            && ($requestRecord['authenticated_user_id'] ?? null) === 11
            && ($requestRecord['entity_id'] ?? null) === 13
            && !array_key_exists('body', $requestRecord)
            && !array_key_exists('query', $requestRecord),
        'request summaries must contain safe correlation context without payloads'
    );

    $raw = is_file($logFile) ? (string) file_get_contents($logFile) : '';
    $assert(
        !str_contains($raw, 'plain-password')
            && !str_contains($raw, 'plain-token')
            && !str_contains($raw, 'plain-secret')
            && !str_contains($raw, 'plain-exception-token'),
        'passwords, bearer tokens and secret query values must be redacted'
    );
} finally {
    foreach (glob($logPath . '/*') ?: [] as $file) {
        is_file($file) && unlink($file);
    }
    is_dir($logPath) && rmdir($logPath);
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "System logging test passed\n");
