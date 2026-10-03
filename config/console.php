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
        'chat:migrate-teamless' => \app\command\ChatMigrate::class,
        'system:cleanup' => \app\command\SystemCleanup::class,
        'service:call' => \app\command\CallService::class,
        'docs:services' => \app\command\GenerateServiceDocs::class,
        'docs:permissions' => \app\command\GeneratePermissionDocs::class,
        'admin:grant' => \app\command\AdminGrant::class,
        'admin:revoke' => \app\command\AdminRevoke::class,
        'team:grant-ability' => \app\command\TeamGrantAbility::class,
        'ability:expiration:backfill' => \app\command\BackfillAbilityExpiration::class,
        'certificate:update' => \app\command\UpdateCertificates::class,
        'oss:fallback:deploy' => \app\command\DeployOssFallback::class,
        'oss:fallback:configure' => \app\command\ConfigureOssFallback::class,
        'oss:fallback:publish' => \app\command\PublishOssFallback::class,
        'weibo:feed-poll' => \app\command\WeiboFeedPoll::class,
    ],
];
