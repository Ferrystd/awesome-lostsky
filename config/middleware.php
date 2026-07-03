<?php
// 中间件配置
return [
    // 别名或分组
    'alias'    => [
        'Cors'               => \app\middleware\Cors::class,
        'Dedup'              => \app\middleware\Dedup::class,
        'JwtAuth'            => \app\middleware\JwtAuth::class,
        'Context'            => \app\middleware\Context::class,
        'TeamAccess'         => \app\middleware\TeamAccess::class,
        'TeamMember'         => \app\middleware\TeamMember::class,
        'MemberAccess'       => \app\middleware\MemberAccess::class,
        'TransactionAbility' => \app\middleware\TransactionAbility::class,
        'TransactionVerify'  => \app\middleware\TransactionVerify::class,
        'TransactionAccess'  => \app\middleware\TransactionAccess::class,
        'ShopAccess'         => \app\middleware\ShopAccess::class,
        'CustomerAccess'     => \app\middleware\CustomerAccess::class,
        'DocAbility'         => \app\middleware\DocAbility::class,
    ],
    // 优先级设置，此数组中的中间件会按照数组中的顺序优先执行
    'priority' => [
        \app\middleware\Cors::class,
        \app\middleware\AppResolver::class,
        \think\app\MultiApp::class,
        \app\middleware\Dedup::class,
    ],
];
