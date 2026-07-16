<?php
// +----------------------------------------------------------------------
// | 控制台配置
// +----------------------------------------------------------------------
return [
    // 指令定义
    'commands' => [
        'file:upload' => \app\command\UploadFile::class,
        'make:model'  => \app\command\MakeModel::class,
    ],
];
