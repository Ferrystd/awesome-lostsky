<?php
// 应用公共文件



/**
 * 获取当前请求的应用模块名
 * @return string
 */
function app_name(): string
{
    return app('http')->getName();
}

/**
 * 成功响应
 */
function success($data = [], string $msg = 'ok'): \think\response\Json
{
    return json(['code' => 0, 'message' => $msg, 'data' => $data]);
}

/**
 * 业务错误响应
 */
function error(string $msg = 'error', int $code = 1, int $http = 200): \think\response\Json
{
    return json(['code' => $code, 'message' => $msg, 'data' => null], $http);
}

/**
 * 纯消息响应（无数据）
 */
function message(string $msg): \think\response\Json
{
    return json(['code' => 0, 'message' => $msg, 'data' => null]);
}

