<?php
// 中间件配置
return [
    // 别名或分组
    'alias'    => [
        'Cors'               => \app\middleware\Cors::class,
        'Dedup'              => \app\middleware\Dedup::class,
        'JwtAuth'            => \app\middleware\JwtAuth::class,
        'Context'            => \app\middleware\Context::class,
        'EntityRequired'     => \app\middleware\EntityRequired::class,
        'EntityType'         => \app\middleware\EntityType::class,
        'TeamBelongs'        => \app\middleware\TeamBelongs::class,
        'TeamAuth'           => ['EntityRequired', 'TeamBelongs'],
        'TeamWorkspaceAccess'=> \app\middleware\TeamWorkspaceAccess::class,
        'TeamWorkspaceAuth'  => ['EntityRequired', 'TeamWorkspaceAccess'],
        'TeamGuest'          => \app\middleware\TeamGuest::class,
        'TeamMember'         => \app\middleware\TeamMember::class,
        'MemberAccess'       => \app\middleware\MemberAccess::class,
        'Permission'         => \app\middleware\Permission::class,
        'AdminAccess'        => \app\middleware\AdminAccess::class,
        'AdminPermission'    => \app\middleware\AdminPermission::class,
        'Ability'            => \app\middleware\Ability::class,
        'TransactionVerify'  => \app\middleware\TransactionVerify::class,
        'CustomerAccess'     => \app\middleware\CustomerAccess::class,
        'ChatAccess'         => \app\middleware\ChatAccess::class,
    ],
    // 优先级设置，此数组中的中间件会按照数组中的顺序优先执行
    'priority' => [
        \app\middleware\RequestLog::class,
        \app\middleware\Cors::class,
        \app\middleware\AppResolver::class,
        \think\app\MultiApp::class,
        \app\middleware\Dedup::class,
        \app\middleware\JwtAuth::class,
        \app\middleware\Context::class,
        \app\middleware\EntityRequired::class,
        \app\middleware\EntityType::class,
        \app\middleware\TeamBelongs::class,
        \app\middleware\TeamWorkspaceAccess::class,
    ],
];
