# CORS

LostSky handles CORS in the global `app\middleware\Cors` middleware.

- `Access-Control-Allow-Origin` is open by default through `config/cors.php`.
- `allowed_headers` can be set to `*`; preflight responses will echo `Access-Control-Request-Headers` so new frontend request headers do not need backend config changes.
- Exception responses also receive CORS headers through `app\ExceptionHandle`, so browser CORS errors should not hide the real API status or JSON error body.
- If CORS still fails in production, confirm the request reaches ThinkPHP. A direct Nginx response will not run the PHP middleware.
