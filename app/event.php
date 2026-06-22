<?php
// 事件定义文件
return [
    'bind'      => [
    ],

    'listen'    => [
        'AppInit'  => [],
        'HttpRun'  => [
            function () {
                app()->config->set([
                    'domain_bind' => \app\model\TeamDomain::cache('team_domain_bind', 3600)->column('app', 'domain'),
                ], 'app');
            },
        ],
        'HttpEnd'  => [],
        'LogLevel' => [],
        'LogWrite' => [],
    ],

    'subscribe' => [
    ],
];
