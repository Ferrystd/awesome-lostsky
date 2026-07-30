<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\service\PermissionGate;
use think\App;
use think\exception\HttpException;
use think\exception\RouteNotFoundException;
use think\Request;
use think\Route;

$root = dirname(__DIR__);
$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator("{$root}/app"));
foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }

    $path = str_replace('\\', '/', $file->getPathname());
    $relative = substr($path, strlen(str_replace('\\', '/', $root)) + 1);
    $source = (string) file_get_contents($file->getPathname());

    if (str_contains($path, '/controller/') && preg_match('/\$request->param\s*\(/', $source)) {
        $failures[] = "{$relative}: controllers must use route(), get(), or post()";
    }

    if (preg_match('/\((?:int|string|float|bool|array)\)\s*\$request->(?:route|get|post)\s*\(/', $source)) {
        $failures[] = "{$relative}: Request type suffix must replace the outer scalar/array cast";
    }

    if (preg_match('/\((?:int|string|float|bool|array)\)\s*\$request->header\s*\(/', $source)) {
        $failures[] = "{$relative}: header values must be checked with is_scalar() before conversion";
    }

    if (!in_array($relative, ['app/middleware/AppResolver.php', 'app/middleware/Context.php'], true)
        && preg_match(
            '/\((?:int|string|float|bool|array)\)\s*\(?\s*\$request->(?:team_id|user_id|authenticated_user_id|entity_id|customer_id|member_id|acting_entity)\b/',
            $source
        )) {
        $failures[] = "{$relative}: typed request context must not be converted again by consumers";
    }
}

foreach (['admin', 'shop', 'transaction'] as $appName) {
    $routeFile = "{$root}/app/{$appName}/route/app.php";
    $source = (string) file_get_contents($routeFile);

    if (str_contains($source, '<id>')
        && !preg_match("/Route::pattern\\(\\['id'\\s*=>\\s*'int'\\]\\);/", $source)) {
        $failures[] = "app/{$appName}/route/app.php: <id> requires an application-level integer pattern";
    }
    if (preg_match("/->pattern\\(\\['id'/", $source)) {
        $failures[] = "app/{$appName}/route/app.php: per-route id patterns duplicate the global rule";
    }
}

$routeIdControllers = [
    'app/admin/controller/Access.php',
    'app/admin/controller/Teams.php',
    'app/admin/controller/Users.php',
    'app/shop/controller/Storefront.php',
    'app/shop/controller/Product.php',
    'app/shop/controller/Order.php',
    'app/shop/controller/Customer.php',
    'app/transaction/controller/Transaction.php',
];
foreach ($routeIdControllers as $relative) {
    $source = (string) file_get_contents("{$root}/{$relative}");
    if (preg_match('/\$request->(?:get|post)\([\'"]id(?:\/[abdfs])?[\'"]/', $source)) {
        $failures[] = "{$relative}: route id must not be read from query or body";
    }
    if (preg_match('/\$request->route\([\'"]id(?!\/d)[\'"]/', $source)) {
        $failures[] = "{$relative}: route id must use the /d suffix";
    }
}

$app = new App($root);
$app->initialize();
$route = new Route($app);
$route->pattern(['id' => 'int']);
$route->get('request-types/<id>', static fn () => 'ok');

$request = (new Request)
    ->setMethod('GET')
    ->setPathinfo('request-types/42')
    ->setUrl('/request-types/42')
    ->withGet(['id' => '77', 'page' => '12', 'label' => 123])
    ->withPost(['id' => '88', 'enabled' => '1', 'items' => ['one', 'two']]);
$response = $route->dispatch($request);

$assert($response->getCode() === 200, 'numeric route id must match');
$assert($request->route('id/d') === 42, 'route id must convert to int with /d');
$assert($request->get('id/d') === 77, 'query id remains isolated from route id');
$assert($request->post('id/d') === 88, 'body id remains isolated from route id');
$assert($request->route('id/d') === 42, 'query/body id must not overwrite route id');
$assert($request->get('page/d') === 12, 'GET /d must return int');
$assert($request->get('label/s') === '123', 'GET /s must return string');
$assert($request->post('enabled/b') === true, 'POST /b must return bool');
$assert($request->post('items/a') === ['one', 'two'], 'POST /a must return array');

try {
    $route->dispatch(
        (new Request)
            ->setMethod('GET')
            ->setPathinfo('request-types/not-a-number')
            ->setUrl('/request-types/not-a-number')
    );
    $failures[] = 'non-numeric route id must return 404';
} catch (RouteNotFoundException $exception) {
    $assert($exception->getStatusCode() === 404, 'non-numeric route id must return 404');
}

try {
    (new PermissionGate)->candidates(
        (new Request)->withGet(['slug' => 'query'])->withPost(['slug' => 'body']),
        'chat.virtual.<slug>.manage'
    );
    $failures[] = 'generic multi-source readers must reject conflicting values';
} catch (HttpException $exception) {
    $assert($exception->getStatusCode() === 422, 'multi-source conflict must return 422');
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Request boundary type test passed\n");
