<?php
declare(strict_types=1);

namespace app\middleware;

use Closure;
use think\Request;
use think\Response;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        $origin = $request->header('Origin');

        if ($request->method(true) === 'OPTIONS') {
            $response = Response::create('', 'html', 204);
        } else {
            $response = $next($request);
        }

        $allowOrigin = $this->allowOrigin($origin);
        if (!$allowOrigin) {
            return $response;
        }

        $headers = [
            'Access-Control-Allow-Origin' => $allowOrigin,
            'Access-Control-Allow-Methods' => config('cors.allowed_methods'),
            'Access-Control-Allow-Headers' => config('cors.allowed_headers'),
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

        return $response->header($headers);
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
}
