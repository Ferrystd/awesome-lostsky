<?php

$rootDomain = trim((string) env('APP_DOMAIN_ROOT', 'lostsky.work'));
$defaultNames = [
    $rootDomain,
    "*.{$rootDomain}",
    "*.api.{$rootDomain}",
    "*.team.{$rootDomain}",
    "*.chat.{$rootDomain}",
    "*.transaction.{$rootDomain}",
    "*.display.{$rootDomain}",
    "*.shop.{$rootDomain}",
    "*.account.api.{$rootDomain}",
    "*.admin.api.{$rootDomain}",
    "*.common.api.{$rootDomain}",
    "*.team.api.{$rootDomain}",
    "*.chat.api.{$rootDomain}",
    "*.transaction.api.{$rootDomain}",
    "*.display.api.{$rootDomain}",
    "*.shop.api.{$rootDomain}",
];
$configuredNames = trim((string) env('TLS_REQUIRED_NAMES', ''));

return [
    'certificate_path' => env(
        'TLS_CERTIFICATE_PATH',
        "/etc/letsencrypt/live/{$rootDomain}/fullchain.pem"
    ),
    'private_key_path' => env(
        'TLS_PRIVATE_KEY_PATH',
        "/etc/letsencrypt/live/{$rootDomain}/privkey.pem"
    ),
    'nginx_binary' => env('TLS_NGINX_BINARY', 'nginx'),
    'required_names' => $configuredNames === ''
        ? $defaultNames
        : array_values(array_filter(array_map('trim', explode(',', $configuredNames)))),
];
