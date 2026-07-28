<?php

return [
    // JWT 密钥
    'secret' => env('jwt.secret', ''),

    // 加密算法
    'algo' => env('jwt.algo', 'HS256'),

    // 签发者
    'iss' => env('jwt.iss', 'lostsky'),

    // 有效时长 (秒)
    'ttl' => env('jwt.ttl', 7200),

    // 刷新时长 (秒)
    'refresh_ttl' => env('jwt.refresh_ttl', 1209600),

    // 过期容差 (秒)
    'leeway' => env('jwt.leeway', 0),
];
