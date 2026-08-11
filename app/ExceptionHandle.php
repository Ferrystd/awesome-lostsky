<?php
declare(strict_types=1);

namespace app;

use app\exception\EntityContextException;
use app\exception\AccessDeniedException;
use app\middleware\Cors;
use app\support\SystemLog;
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
    public function report(Throwable $exception): void
    {
        if ($this->isIgnoreReport($exception)) {
            return;
        }

        $context = [
            'exception' => $exception::class,
            'code' => $exception->getCode(),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ];

        if (!$this->app->runningInConsole()) {
            $request = $this->app->request;
            $context += [
                'request_id' => $request->request_id ?? null,
                'method' => $request->method(true),
                'host' => $request->host(),
                'path' => '/' . ltrim($request->pathinfo(), '/'),
                'application' => $this->app->http->getName(),
            ];
        }
        if ($this->app->isDebug()) {
            $context['trace'] = $exception->getTraceAsString();
        }

        try {
            $this->app->make(SystemLog::class)->write('error', 'exception.unhandled', $context);
        } catch (Throwable) {
            // 日志失败不能覆盖原始异常。
        }
    }

    public function render($request, Throwable $e): Response
    {
        if ($e instanceof ValidateException) {
            $response = json([
                'code'    => 422,
                'message' => $e->getError(),
                'data'    => null,
            ], 422);
        } elseif ($e instanceof EntityContextException || $e instanceof AccessDeniedException) {
            $response = json([
                'code'    => $e->getCode(),
                'message' => $e->getMessage(),
                'data'    => $e->data(),
            ], $e->getStatusCode());
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
