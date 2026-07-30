<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$apps = ['account', 'admin', 'chat', 'common', 'display', 'shop', 'team', 'transaction'];
$errors = [];

foreach ($apps as $app) {
    $routeFile = "{$root}/app/{$app}/route/app.php";
    $openApiFile = "{$root}/docs/openapi/{$app}.openapi.json";
    $source = file_get_contents($routeFile);
    $document = json_decode((string) file_get_contents($openApiFile), true, 512, JSON_THROW_ON_ERROR);
    $routes = [];
    $definitions = [];

    preg_match_all(
        "/Route::(get|post|put|delete|patch)\\('([^']+)'[^;]*;/",
        (string) $source,
        $matches,
        PREG_SET_ORDER
    );
    foreach ($matches as $match) {
        $path = preg_replace('/<([A-Za-z_][A-Za-z0-9_]*)>/', '{$1}', $match[2]);
        $routes[strtolower($match[1]) . ' /' . ltrim((string) $path, '/')] = true;
        $definitions[] = [
            'method' => strtolower($match[1]),
            'path' => trim($match[2], '/'),
            'complete' => str_contains($match[0], '->completeMatch()'),
        ];
    }

    if ($app === 'shop') {
        foreach ($definitions as $index => $definition) {
            if ($definition['complete']) {
                continue;
            }
            foreach (array_slice($definitions, $index + 1) as $later) {
                if ($definition['method'] === $later['method']
                    && str_starts_with($later['path'], $definition['path'] . '/')) {
                    $errors[] = "shop: prefix route must use completeMatch: {$definition['method']} /{$definition['path']}";
                    break;
                }
            }
        }
    }

    $operations = [];
    foreach ($document['paths'] ?? [] as $path => $pathItem) {
        foreach (['get', 'post', 'put', 'delete', 'patch'] as $method) {
            if (isset($pathItem[$method])) {
                $operations["{$method} {$path}"] = true;
            }
        }
    }

    foreach (array_diff_key($routes, $operations) as $operation => $_) {
        $errors[] = "{$app}: route missing from OpenAPI: {$operation}";
    }
    foreach (array_diff_key($operations, $routes) as $operation => $_) {
        $errors[] = "{$app}: OpenAPI operation missing from routes: {$operation}";
    }
}

if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "OpenAPI route contract test passed\n");
