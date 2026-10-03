<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\middleware\AppResolver;
use think\App;
use think\exception\HttpException;
use think\Request;

$root = dirname(__DIR__);
(new App($root))->initialize();
$apiHost = 'chat.api.' . config('app.domain.root');
$request = (new Request)->setHost($apiHost)->setPathinfo('integration/message');
$handled = app(AppResolver::class)->handle($request, static fn (): string => app('http')->getName());
if ($handled !== 'chat' || app('http')->getName() !== 'chat') {
    fwrite(STDERR, "teamless API host did not resolve Chat\n");
    exit(1);
}

try {
    app(AppResolver::class)->handle(
        (new Request)->setHost('team.api.' . config('app.domain.root')),
        static fn (): string => 'unexpected'
    );
    fwrite(STDERR, "team-scoped app unexpectedly accepted a teamless API host\n");
    exit(1);
} catch (HttpException $exception) {
    if ($exception->getStatusCode() !== 404) {
        fwrite(STDERR, "team-scoped app returned the wrong status\n");
        exit(1);
    }
}

fwrite(STDOUT, "App resolver teamless host test passed\n");
