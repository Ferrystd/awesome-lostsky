<?php

$levels = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('LOG_LEVEL', 'info,notice,warning,error,critical,alert,emergency'))
)));

// +----------------------------------------------------------------------
// | 日志设置
// +----------------------------------------------------------------------
return [
    // 默认日志记录通道
    'default'      => 'file',
    // 日志记录级别
    'level'        => $levels,
    // 日志类型记录的通道 ['error'=>'email',...]
    'type_channel' => [],
    // 关闭全局日志写入
    'close'        => (bool) env('LOG_CLOSE', false),
    // 全局日志处理 支持闭包
    'processor'    => null,

    // 日志通道列表
    'channels'     => [
        'file' => [
            // 日志记录方式
            'type'           => \app\log\JsonFile::class,
            // 日志保存目录
            'path'           => (string) env('LOG_PATH', ''),
            // 单文件日志写入
            'single'         => false,
            // 独立日志级别
            'apart_level'    => [],
            // 最大日志文件数量
            'max_files'      => max(1, (int) env('LOG_MAX_FILES', 30)),
            // 单个日志文件大小，超过后自动轮转
            'file_size'      => max(1048576, (int) env('LOG_FILE_SIZE', 10485760)),
            // 使用JSON格式记录
            'json'           => true,
            // 日志处理
            'processor'      => null,
            // 关闭通道日志写入
            'close'          => (bool) env('LOG_CLOSE', false),
            // 日志输出格式化
            'format'         => '[%s][%s] %s',
            // 是否实时写入
            'realtime_write' => false,
        ],
        // 其它日志通道配置
    ],

];
