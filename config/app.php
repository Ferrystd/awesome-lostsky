<?php
// +----------------------------------------------------------------------
// | 应用设置
// +----------------------------------------------------------------------

return [
    // 应用的命名空间
    'app_namespace'    => '',
    // 是否启用路由
    'with_route'       => true,
    // 默认应用
    'default_app'      => 'account',
    // 默认时区
    'default_timezone' => 'Asia/Shanghai',

    // 应用映射（自动多应用模式有效）
    'app_map'          => [],
    // 是否启用应用快速分发（未识别的路径回落到默认应用）
    'app_express'      => true,
    // 域名绑定（自动多应用模式有效）
    'domain_bind'      => [],  // 动态绑定在 app/event.php AppInit 中注入

    // 域名配置（供 route/app.php 等使用）
    'domain'           => [
        'root' => env('APP_DOMAIN_ROOT', env('APP_DEBUG', false) ? 'localhost' : 'lostsky.work'),
        'api'  => env('APP_DOMAIN_API', env('APP_DEBUG', false) ? 'api.localhost' : 'api.lostsky.work'),
    ],
    // 无 team 状态的应用列表（不需要团队上下文即可运行）
    'teamless_apps'    => ['account'],
    // 禁止URL访问的应用列表（自动多应用模式有效）
    'deny_app_list'    => ['common'],

    // 异常页面的模板文件
    'exception_tmpl'   => app()->getThinkPath() . 'tpl/think_exception.tpl',

    // 错误显示信息,非调试模式有效
    'error_message'    => '页面错误！请稍后再试～',
    // 显示错误信息
    'show_error_msg'   => false,
];
