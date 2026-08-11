<?php
return [
    'upload_max_size' => 50 * 1024 * 1024,
    'allowed_extensions' => [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif',
        'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a',
        'pdf', 'txt', 'md', 'csv', 'json',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'zip', '7z', 'rar',
    ],
    'tiers' => [
        0 => ['size' => 128 * 1024 * 1024],
        1 => ['size' => 500 * 1024 * 1024],
        2 => ['size' => 2 * 1024 * 1024 * 1024],
        3 => ['size' => -1], // -1 = 无限制
    ],
];
