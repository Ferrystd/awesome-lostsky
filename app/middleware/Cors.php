<?php
declare(strict_types=1);

namespace app\middleware;

use Closure;
use think\exception\Handle;
use think\Request;
use think\Response;
use Throwable;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        try {
            if ($request->method(true) === 'OPTIONS') {
                $response = Response::create('', 'html', 204);
            } else {
                $response = $next($request);
            }
        } catch (Throwable $e) {
            $response = app(Handle::class)->render($request, $e);
        }

        return $this->withHeaders($request, $response);
    }

    public function withHeaders(Request $request, Response $response): Response
    {
        $headers = $this->headers($request);
        if (!$headers) {
            return $response;
        }

        return $response->header($headers);
    }

    public function headers(Request $request): array
    {
        $origin = $this->header($request, 'Origin');
        $allowOrigin = $this->allowOrigin($origin);
        if (!$allowOrigin) {
            return [];
        }

        $headers = [
            'Access-Control-Allow-Origin' => $allowOrigin,
            'Access-Control-Allow-Methods' => config('cors.allowed_methods'),
            'Access-Control-Allow-Headers' => $this->allowHeaders($request),
            'Access-Control-Max-Age' => (string) config('cors.max_age'),
        ];

        if ($allowOrigin !== '*') {
            $headers['Vary'] = 'Origin';
        }

        if ($allowOrigin !== '*' && config('cors.allow_credentials')) {
            $headers['Access-Control-Allow-Credentials'] = 'true';
        }

        $exposedHeaders = config('cors.exposed_headers');
        if ($exposedHeaders) {
            $headers['Access-Control-Expose-Headers'] = $exposedHeaders;
        }

        return $headers;
    }

    private function allowOrigin(?string $origin): ?string
    {
        $allowedOrigins = config('cors.allowed_origins', []);

        if (in_array('*', $allowedOrigins, true)) {
            return '*';
        }

        if (!$origin) {
            return null;
        }

        if (in_array($origin, $allowedOrigins, true)) {
            return $origin;
        }

        foreach (config('cors.allowed_origin_patterns', []) as $pattern) {
            if (preg_match($pattern, $origin)) {
                return $origin;
            }
        }

        return null;
    }

    private function allowHeaders(Request $request): string
    {
        $allowedHeaders = (string) config('cors.allowed_headers');

        if ($allowedHeaders !== '*') {
            return $allowedHeaders;
        }

        return $this->header($request, 'Access-Control-Request-Headers') ?: '*';
    }

    private function header(Request $request, string $name): string
    {
        $value = $request->header($name);

        return is_scalar($value) ? (string) $value : '';
    }
}
