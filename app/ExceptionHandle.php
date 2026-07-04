<?php
declare(strict_types=1);

namespace app;

use app\middleware\Cors;
use think\exception\Handle;
use think\exception\HttpException;
use think\exception\ValidateException;
use think\Response;
use Throwable;

/**
 * JSON API 异常处理器。
 */
class ExceptionHandle extends Handle
{
    public function render($request, Throwable $e): Response
    {
        if ($e instanceof ValidateException) {
            $response = json([
                'code'    => 422,
                'message' => $e->getError(),
                'data'    => null,
            ], 422);
        } elseif ($e instanceof HttpException) {
            $response = json([
                'code'    => $e->getCode() ?: 1,
                'message' => $e->getMessage(),
                'data'    => null,
            ], $e->getStatusCode());
        } else {
            $message = app()->isDebug() ? $e->getMessage() : '服务器内部错误';
            $code    = $e->getCode() ?: 500;

            $response = json([
                'code'    => $code,
                'message' => $message,
                'data'    => null,
            ], 500);
        }

        return app(Cors::class)->withHeaders($request, $response);
    }
}
