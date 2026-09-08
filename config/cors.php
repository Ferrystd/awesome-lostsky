<?php

return [
    'allowed_origins' => [
        '*',
    ],
    'allowed_origin_patterns' => ['~^https?://(?:[a-z0-9_-]+\.)*lostsky\.work(?::[0-9]+)?$~i'],
    'allowed_methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'allowed_headers' => '*',
    'exposed_headers' => '',
    'max_age' => 86400,
    'allow_credentials' => true,
];
