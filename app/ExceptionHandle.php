<?php
declare(strict_types=1);

namespace app;

use think\exception\Handle;
use think\exception\HttpException;
use think\exception\ValidateException;
use think\Response;
use Throwable;

/**
 * JSON API 异常处理器
 *
 * 将所有异常转换为 JSON 格式的响应，不再输出 HTML。
 */
class ExceptionHandle extends Handle
{
    /**
     * 渲染异常输出
     */
    public function render($request, Throwable $e): Response
    {
        // 验证器异常 — 422
        if ($e instanceof ValidateException) {
            return json([
                'code'    => 422,
                'message' => $e->getError(),
                'data'    => null,
            ], 422);
        }

        // HTTP 异常 — 保持状态码
        if ($e instanceof HttpException) {
            return json([
                'code'    => $e->getCode() ?: 1,
                'message' => $e->getMessage(),
                'data'    => null,
            ], $e->getStatusCode());
        }

        // 其他异常 — 根据 debug 模式决定
        $message = app()->isDebug() ? $e->getMessage() : '服务器内部错误';
        $code    = $e->getCode() ?: 500;

        return json([
            'code'    => $code,
            'message' => $message,
            'data'    => null,
        ], 500);
    }
}
