<?php
declare(strict_types=1);
namespace app\community\middleware;
use think\Request;
/** Anonymous requests stay public; supplied credentials must be valid. */
final class OptionalIdentity
{
    public function handle(Request $request, \Closure $next)
    {
        if (!$request->header('Authorization')) return $next($request);
        return app(\app\middleware\JwtAuth::class)->handle($request, fn ($request) =>
            app(\app\middleware\Context::class)->handle($request, $next));
    }
}
