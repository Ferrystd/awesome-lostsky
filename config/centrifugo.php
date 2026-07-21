<?php

return [
    'client_url' => env('CENTRIFUGO_CLIENT_URL', '/connection/websocket'),
    'api_url' => env('CENTRIFUGO_API_URL', 'http://127.0.0.1:8000'),
    'api_key' => env('CENTRIFUGO_API_KEY', ''),
    'token_secret' => env('CENTRIFUGO_TOKEN_SECRET', ''),
];
