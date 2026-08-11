<?php
declare(strict_types=1);

namespace app\middleware;

use app\support\SystemLog;
use Closure;
use think\Request;
use think\Response;
use Throwable;

/**
 * 为所有 HTTP 请求建立关联 ID 并记录完成状态。
 */
final class RequestLog
{
    public function __construct(private SystemLog $logger)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $request->request_id = $this->requestId($request);
        $startedAt = hrtime(true);

        try {
            $response = $next($request);
        } catch (Throwable $exception) {
            $this->record($request, 500, $startedAt, $exception::class);
            throw $exception;
        }

        $this->record($request, $response->getCode(), $startedAt);

        return $response;
    }

    private function record(Request $request, int $status, int $startedAt, ?string $exception = null): void
    {
        $context = [
            'request_id' => $request->request_id,
            'method' => $request->method(true),
            'host' => $request->host(),
            'path' => '/' . ltrim($request->pathinfo(), '/'),
            'status' => $status,
            'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            'application' => app('http')->getName(),
        ];

        foreach (['team_id', 'authenticated_user_id', 'entity_id'] as $name) {
            if (isset($request->{$name}) && is_int($request->{$name})) {
                $context[$name] = $request->{$name};
            }
        }
        if ($request->controller() !== '') {
            $context['controller'] = $request->controller();
        }
        if ($request->action() !== '') {
            $context['action'] = $request->action();
        }
        if ($exception !== null) {
            $context['exception'] = $exception;
        }

        $level = $status >= 500 ? 'error' : ($status >= 400 ? 'warning' : 'info');
        $this->logger->write($level, 'http.request', $context);
    }

    private function requestId(Request $request): string
    {
        $value = $request->header('X-Request-Id', '');
        $requestId = is_scalar($value) ? trim((string) $value) : '';
        if ($requestId !== ''
            && strlen($requestId) <= 128
            && preg_match('/^[A-Za-z0-9._:-]+$/', $requestId)) {
            return $requestId;
        }

        return bin2hex(random_bytes(16));
    }
}
