<?php
declare(strict_types=1);

$root = realpath($argv[1] ?? dirname(__DIR__));
$routeFile = realpath($argv[2] ?? $root . '/app/team/route/app.php');
if ($root === false || $routeFile === false) {
    fwrite(STDERR, "Release root or route file is unavailable.\n");
    exit(2);
}

require $root . '/vendor/autoload.php';
$app = new \think\App($root);
$app->initialize();
$route = new class($app) extends \think\Route {
    public function matchRequest(\think\Request $request): \think\route\Dispatch
    {
        $this->request = $request;
        $this->host = $request->host(true);
        return $this->check(str_replace('/', '|', $request->pathinfo()), false);
    }
};
$app->instance('route', $route);
require $routeFile;

$cases = [
    ['GET', 'doc', 'index'],
    ['GET', 'doc/get', 'get'],
    ['POST', 'doc/create', 'create'],
    ['POST', 'doc/edit', 'edit'],
    ['POST', 'doc/delete', 'delete'],
];

foreach ($cases as [$method, $path, $action]) {
    $dispatch = $route->matchRequest((new \think\Request)->setMethod($method)->setPathinfo($path));
    if ($dispatch->getDispatch() !== ['Doc', $action] || $dispatch->getParam() !== []) {
        fwrite(STDERR, "Document route mismatch for {$method} /{$path}: " . json_encode([
            $dispatch->getDispatch(), $dispatch->getParam(),
        ]) . "\n");
        exit(1);
    }
}

fwrite(STDOUT, "Document route dispatch OK: 5 cases.\n");
