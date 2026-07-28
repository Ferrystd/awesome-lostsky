<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];

/**
 * @return array{exit: int, stdout: string, stderr: string, json: mixed}
 */
$run = static function (string $service, string $method, ?string $params = null) use ($root): array {
    $command = [PHP_BINARY, $root . DIRECTORY_SEPARATOR . 'think', 'service:call', $service, $method];
    if ($params !== null) {
        $command[] = '--params=' . $params;
    }

    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $process = proc_open($command, $descriptors, $pipes, $root, null, ['bypass_shell' => true]);
    if (!is_resource($process)) {
        throw new RuntimeException('Unable to start service:call');
    }

    fclose($pipes[0]);
    $stdout = trim(stream_get_contents($pipes[1]));
    $stderr = trim(stream_get_contents($pipes[2]));
    fclose($pipes[1]);
    fclose($pipes[2]);

    return [
        'exit' => proc_close($process),
        'stdout' => $stdout,
        'stderr' => $stderr,
        'json' => json_decode($stdout, true),
    ];
};

$assertSuccess = static function (array $result, mixed $data, string $case) use (&$failures): void {
    if (
        $result['exit'] !== 0
        || $result['stderr'] !== ''
        || !is_array($result['json'])
        || $result['json']['code'] !== 0
        || $result['json']['message'] !== 'ok'
        || $result['json']['data'] !== $data
    ) {
        $failures[] = "{$case}: " . json_encode($result, JSON_UNESCAPED_UNICODE);
    }
};

$assertFailure = static function (array $result, int $httpCode, string $case) use (&$failures): void {
    if (
        $result['exit'] !== 1
        || $result['stderr'] !== ''
        || !is_array($result['json'])
        || $result['json']['code'] !== 1
        || !is_string($result['json']['message'])
        || $result['json']['message'] === ''
        || ($result['json']['data']['http_code'] ?? null) !== $httpCode
    ) {
        $failures[] = "{$case}: " . json_encode($result, JSON_UNESCAPED_UNICODE);
    }
};

$assertSuccess(
    $run('Pagination', 'normalize', '{"limit":200,"page":0}'),
    [1, 100],
    'instance method binds named parameters independent of order'
);
$assertSuccess(
    $run('PermissionDictionary', 'assume', '{"type":"member"}'),
    'identity.member.*.assume',
    'static method applies default parameters'
);
$assertSuccess(
    $run('Visibility', 'assertManage', '{"scope":1,"isTeamManager":true,"isSubject":false}'),
    null,
    'backed enum parameter is constructed from its backing value'
);

$assertFailure($run('Pagination', 'normalize', '{'), 422, 'invalid json is rejected');
$assertFailure($run('Pagination', 'normalize', '[]'), 422, 'json list is rejected');
$assertFailure($run('', '', '{}'), 422, 'missing service and method use the json error contract');
$assertFailure($run('Pagination', 'normalize', '{"page":1}'), 422, 'missing parameter is rejected');
$assertFailure(
    $run('Pagination', 'normalize', '{"page":1,"limit":20,"extra":true}'),
    422,
    'unknown parameter is rejected'
);
$assertFailure(
    $run('Pagination', 'normalize', '{"page":"1","limit":20}'),
    422,
    'scalar strings are not coerced'
);
$assertFailure($run('Missing', 'normalize', '{}'), 404, 'unknown service is rejected');
$assertFailure($run('pagination', 'normalize', '{}'), 404, 'service class name is case sensitive');
$assertFailure($run('Pagination', 'missing', '{}'), 404, 'unknown method is rejected');
$assertFailure($run('Visibility', 'hasTarget', '{}'), 404, 'private method is rejected');
$assertFailure($run('Pagination', '__construct', '{}'), 404, 'magic method is rejected');
$assertFailure($run('app\service\Pagination', 'normalize', '{}'), 404, 'fqcn is rejected');
$assertFailure($run('../Pagination', 'normalize', '{}'), 404, 'path traversal is rejected');
$assertFailure(
    $run('File', 'upload', '{"file":{},"teamId":1,"actor":[]}'),
    422,
    'object parameter is rejected before invocation'
);
$assertFailure(
    $run('Visibility', 'assertManage', '{"scope":1,"isTeamManager":false,"isSubject":false}'),
    403,
    'service http exception status is preserved'
);
$assertFailure(
    $run('PermissionDictionary', 'entityField', '{"type":"unsupported"}'),
    500,
    'non-http service exception falls back to status 500'
);

if ($failures !== []) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

echo "service call tests passed\n";
