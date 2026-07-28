# CORS 边界

## API

全局 `app\middleware\Cors` 中间件统一处理。

### 处理原则

- 允许来源由 `config/cors.php` 配置。
- `allowed_headers` 为 `*`；预检响应会回显 `Access-Control-Request-Headers`。
- CORS 位于全局中间件链首部，预检请求进入应用前返回。
- `app\ExceptionHandle` 也为异常响应补充 CORS 头。

### 故障定位

如果生产环境仍出现跨域错误：

1. 确认请求确实进入 ThinkPHP，而不是由 Nginx、CDN 或上游代理直接返回。
2. 检查响应中是否存在重复或互相冲突的 `Access-Control-Allow-Origin`。
3. 检查预检请求的 Origin、方法和请求头是否与实际业务请求一致。
4. 先读取真实响应状态和错误体，再处理被跨域提示掩盖的业务错误。

## 静态资源

在 `assets.lostsky.work`配置增加：

```ini
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
add_header Access-Control-Allow-Headers "Range, If-None-Match, If-Modified-Since" always;
add_header Access-Control-Expose-Headers "Content-Length, Content-Range, ETag" always;
add_header Cross-Origin-Resource-Policy "cross-origin" always;
```
