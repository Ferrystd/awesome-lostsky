<?php
// +----------------------------------------------------------------------
// | 控制台配置
// +----------------------------------------------------------------------
return [
    // 指令定义
    'commands' => [
        'file:upload' => \app\command\UploadFile::class,
        'make:model'  => \app\command\MakeModel::class,
        'notice:send' => \app\command\SendNotice::class,
        'chat:worker' => \app\command\ChatWorker::class,
        'chat:cleanup' => \app\command\ChatCleanup::class,
        'system:cleanup' => \app\command\SystemCleanup::class,
        'service:call' => \app\command\CallService::class,
        'docs:services' => \app\command\GenerateServiceDocs::class,
    ],
];
