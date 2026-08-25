<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$apps = ['account', 'admin', 'chat', 'common', 'display', 'shop', 'team', 'transaction', 'weibo'];
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

    if (in_array($app, ['shop', 'team', 'transaction', 'weibo'], true)) {
        foreach ($definitions as $index => $definition) {
            if ($definition['complete']
                || ($app === 'team' && !str_starts_with($definition['path'], 'customer'))) {
                continue;
            }
            foreach (array_slice($definitions, $index + 1) as $later) {
                if ($definition['method'] === $later['method']
                    && str_starts_with($later['path'], $definition['path'] . '/')) {
                    $errors[] = "{$app}: prefix route must use completeMatch: {$definition['method']} /{$definition['path']}";
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

$teamOpenApi = json_decode((string) file_get_contents("{$root}/docs/openapi/team.openapi.json"), true, 512, JSON_THROW_ON_ERROR);
$shopOpenApi = json_decode((string) file_get_contents("{$root}/docs/openapi/shop.openapi.json"), true, 512, JSON_THROW_ON_ERROR);
$requiredUsage = ['count', 'total_size', 'size_limit', 'remaining_size', 'available', 'reason'];
foreach (['team' => $teamOpenApi, 'shop' => $shopOpenApi] as $app => $document) {
    $required = $document['components']['schemas']['FileUsage']['required'] ?? [];
    if (array_diff($requiredUsage, $required)) {
        $errors[] = "{$app}: FileUsage must expose the complete byte-capacity status";
    }
}
if (!in_array('file_upload', $teamOpenApi['components']['schemas']['TeamAccessSnapshot']['required'] ?? [], true)
    || !in_array('file_upload', $teamOpenApi['components']['schemas']['JoinForm']['required'] ?? [], true)) {
    $errors[] = 'team: access and join form contracts must expose file_upload';
}
if (!in_array('file_upload', $shopOpenApi['components']['schemas']['WorkspaceAccessSnapshot']['required'] ?? [], true)
    || !in_array('file_upload', $shopOpenApi['components']['schemas']['CustomerSelfProfile']['required'] ?? [], true)) {
    $errors[] = 'shop: manage access and customer profile contracts must expose file_upload';
}
$restartSchema = $shopOpenApi['paths']['/customer/service-redemptions/{id}/start']['post']
    ['requestBody']['content']['application/json']['schema'] ?? [];
if (($shopOpenApi['paths']['/customer/service-redemptions/{id}/start']['post']['requestBody']['required'] ?? false) !== true
    || array_diff(['handler_entity_id'], $restartSchema['required'] ?? [])
    || array_diff(['handler_entity_id', 'memo', 'field_values'], array_keys($restartSchema['properties'] ?? []))) {
    $errors[] = 'shop: restart service redemption must document its required request body';
}

if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "OpenAPI route contract test passed\n");
