<?php
declare(strict_types=1);

/**
 * Every Team-scoped POST route is deliberately classified. Audited routes must
 * use the centralized writer in their controller; exclusions are limited to
 * reads/previews, read receipts, ordinary chat traffic and realtime transport.
 */
$root = dirname(__DIR__);
$classification = [
    'team' => [
        'audit' => [
            'personal/profile', 'personal/slug', 'personal/fields', 'personal/upload',
            'ability/card/redeem', 'me/edit', 'me/slug', 'me/fields', 'member/add',
            'member/edit', 'member/block', 'member/unblock', 'member/slug',
            'memberDeparture/apply', 'memberDeparture/depart', 'memberDeparture/cancel',
            'memberDeparture/approve', 'memberDeparture/reject', 'entity/profile',
            'entity/display', 'entity/visibility', 'entity/presentation', 'customer/<id>', 'role/add', 'role/edit',
            'role/delete', 'rolePermission/save', 'entityRole/save', 'notice/send',
            'entityField/create', 'entityField/update', 'entityField/delete', 'entityField/values',
            'chatVirtual/create', 'chatVirtual/update', 'chatVirtual/delete',
            'chatIntegration/create', 'chatIntegration/update', 'chatIntegration/rotate',
            'chatIntegration/delete', 'join/apply', 'join/cancel', 'join/upload',
            'joinReview/review', 'joinReview/reject', 'joinReview/approve',
            'joinReview/saveTasks', 'joinReview/setTaskPassed', 'joinField/add',
            'joinField/edit', 'joinField/delete', 'setting', 'file/upload', 'file/delete',
            'doc/create', 'doc/edit', 'doc/delete',
        ],
        'exclude' => [
            'ability/card/inspect' => '预检请求，不改变业务状态',
            'member/search' => '兼容性搜索接口，仅读取数据',
            'notice/confirm' => '通知已读状态',
            'notice/confirmAll' => '通知已读状态',
            'notice/receive' => '通知接收状态',
            'notice/receiveAll' => '通知接收状态',
        ],
    ],
    'shop' => [
        'audit' => [
            'product', 'product/<id>', 'product/<id>/delete', 'product/<id>/handlers',
            'product/<id>/redemption-fields', 'product/<id>/redemption-fields/<field_id>',
            'product/<id>/redemption-fields/<field_id>/delete', 'personal/products',
            'personal/products/<id>', 'personal/products/<id>/handlers',
            'personal/products/<id>/redemption-fields',
            'personal/products/<id>/redemption-fields/<field_id>',
            'personal/products/<id>/redemption-fields/<field_id>/delete',
            'manage/services', 'manage/services/<id>', 'manage/services/<id>/disable',
            'manage/services/<id>/handlers',
            'manage/packages', 'manage/packages/<id>', 'manage/packages/<id>/disable',
            'manage/campaigns', 'manage/campaigns/<id>', 'manage/campaigns/<id>/disable',
            'manage/campaigns/<id>/codes', 'manage/campaigns/<id>/codes/<code_id>/disable',
            'order', 'order/<id>/cancel', 'order/<id>/complete', 'customer/bind',
            'customer/me', 'customer/upload', 'customer/slug', 'customer/orders',
            'customer/orders/<id>/cancel', 'customer/services/<id>/start',
            'customer/services/<id>/offers', 'customer/service-offers/<id>/withdraw',
            'customer/service-redemptions/<id>/start',
            'customer/service-redemptions/<id>/cancel',
            'customer/service-redemptions/<id>/adjustments/<adjustment_id>/accept',
            'customer/service-redemptions/<id>/adjustments/<adjustment_id>/reject',
            'customer/cards/claim',
        ],
        'exclude' => [
            'manage/campaigns/<id>/codes/<code_id>/reveal' => '读取一次性密钥，不改变业务状态',
            'customer/cards/<id>/reveal' => '读取已持有卡密，不改变业务状态',
        ],
    ],
    'transaction' => [
        'audit' => [
            'personal/services/<id>/claim', 'personal/services/<id>/return',
            'personal/service-offers/<id>/accept', 'personal/service-offers/<id>/reject',
            'transaction', 'transaction/<id>', 'transaction/<id>/delete',
            'service/<id>/reassign', 'service/<id>/cancel/approve',
            'service/<id>/cancel/reject', 'service/<id>/complete',
            'service/<id>/adjustments', 'service/<id>/adjustments/<adjustment_id>/cancel',
            'transaction/sender/bind', 'transaction/sender/unbind',
            'transaction/balance/recharge',
        ],
        'exclude' => [],
    ],
    'chat' => [
        'audit' => [
            'virtual/create', 'virtual/update', 'virtual/delete', 'integration/create',
            'integration/update', 'integration/rotate', 'integration/delete',
            'conversation/create', 'conversation/close', 'conversation/participant/add',
            'conversation/participant/remove', 'entityField/create', 'entityField/values',
        ],
        'exclude' => [
            'integration/message' => '普通聊天消息',
            'message/send' => '普通聊天消息',
            'message/edit' => '普通聊天消息',
            'message/revoke' => '普通聊天消息',
            'message/read' => '消息已读状态',
            'realtime/connect' => '实时连接控制',
            'realtime/subscribe' => '实时订阅控制',
        ],
    ],
];

foreach ($classification as $application => $groups) {
    $routeFile = "{$root}/app/{$application}/route/app.php";
    $source = file_get_contents($routeFile);
    preg_match_all("/Route::post\('([^']+)',\s*'([^']+)'\)/", $source, $matches, PREG_SET_ORDER);
    $routes = [];
    foreach ($matches as $match) {
        $routes[$match[1]] = $match[2];
    }
    $classified = array_merge($groups['audit'], array_keys($groups['exclude']));
    $missing = array_values(array_diff(array_keys($routes), $classified));
    $stale = array_values(array_diff($classified, array_keys($routes)));
    if ($missing || $stale) {
        throw new RuntimeException("{$application} POST 路由审计分类不完整：missing=" . json_encode($missing) . ', stale=' . json_encode($stale));
    }
    foreach ($groups['audit'] as $route) {
        [$controller] = explode('/', $routes[$route], 2);
        $controllerFile = "{$root}/app/{$application}/controller/" . ucfirst($controller) . '.php';
        if (!is_file($controllerFile)) {
            foreach (glob("{$root}/app/{$application}/controller/*.php") as $candidate) {
                if (strcasecmp(pathinfo($candidate, PATHINFO_FILENAME), $controller) === 0) {
                    $controllerFile = $candidate;
                    break;
                }
            }
        }
        if (!str_contains((string) file_get_contents($controllerFile), 'BusinessAudit::class')) {
            throw new RuntimeException("{$application} {$route} 的控制器未使用 BusinessAudit");
        }
    }
}

fwrite(STDOUT, "Audit route classification tests passed\n");
