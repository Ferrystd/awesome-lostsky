<?php
// 全局中间件定义文件
return [
    \app\middleware\Cors::class,
    \app\middleware\AppResolver::class,
    \app\middleware\Dedup::class,
];
