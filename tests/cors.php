<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

$app = new think\App(dirname(__DIR__));
$app->initialize();
$cors = new app\middleware\Cors();
$failures = [];
foreach ([
    'https://account.lostsky.work' => true,
    'https://demo.team.lostsky.work' => true,
    'http://demo.team.lostsky.work:5175' => true,
    'https://lostsky.work.example.test' => false,
    'https://example.test' => false,
] as $origin => $credentialed) {
    $request = (new think\Request())->withHeader([
        'Origin' => $origin,
        'Access-Control-Request-Headers' => 'authorization,content-type,x-page-id',
    ]);
    $headers = $cors->headers($request);
    if (($headers['Access-Control-Allow-Origin'] ?? '') !== ($credentialed ? $origin : '*')
        || isset($headers['Access-Control-Allow-Credentials']) !== $credentialed
        || ($credentialed && ($headers['Vary'] ?? '') !== 'Origin')
        || ($headers['Access-Control-Allow-Headers'] ?? '') !== 'authorization,content-type,x-page-id') {
        $failures[] = $origin;
    }
}
if ($failures) {
    fwrite(STDERR, 'CORS regressions: ' . implode(', ', $failures) . PHP_EOL);
    exit(1);
}
echo "CORS credential and public-origin checks passed\n";
