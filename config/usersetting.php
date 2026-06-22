<?php

/**
 * 用户设置项的默认值 — 按应用分组
 * 当用户未显式设置时，获取器自动回退到此文件的值
 */
return [
    // 默认应用
    'index' => [
        // 'key' => default_value,
        'theme'   => 'light',
        'per_page' => 20,
        'lang'    => 'zh-CN',
    ],

    'admin' => [
        'theme'   => 'light',
        'per_page' => 30,
    ],
];
