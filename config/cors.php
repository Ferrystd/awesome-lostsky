<?php

return [
    'allowed_origins' => [
        '*',
    ],
    'allowed_origin_patterns' => [],
    'allowed_methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'allowed_headers' => 'Authorization, Content-Type, X-Requested-With, X-Page-Id, X-Team-Id, X-Member-Id',
    'exposed_headers' => '',
    'max_age' => 86400,
    'allow_credentials' => false,
];
