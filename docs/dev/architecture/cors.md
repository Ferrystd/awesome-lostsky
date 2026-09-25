# CORS 边界

## API

全局 `app\middleware\Cors` 中间件统一处理。

### 处理原则

- 允许来源由 `config/cors.php` 的 `allowed_origins` 与 `allowed_origin_patterns` 共同配置。当前配置保留 `*`，并优先显式匹配 `lostsky.work` 的 HTTP(S) 子域名和可选端口；没有 Origin 或没有匹配模式时回退为 `*`，不授予凭据。
- 带有匹配模式的 Origin 返回请求的具体 Origin、`Vary: Origin` 和 `Access-Control-Allow-Credentials: true`；CORS 只控制浏览器跨域读取，不能替代 JWT、Entity 或 Permission 鉴权。
- `allowed_headers` 为 `*`；预检响应会回显 `Access-Control-Request-Headers`。
- CORS 位于 `RequestLog` 之后、`AppResolver` 之前，预检请求进入应用前返回。
- `app\ExceptionHandle` 也为异常响应补充 CORS 头。

### 故障定位

如果生产环境仍出现跨域错误：

1. 确认请求确实进入 ThinkPHP，而不是由 Nginx、CDN 或上游代理直接返回。
2. 检查响应中是否存在重复或互相冲突的 `Access-Control-Allow-Origin`。
3. 检查预检请求的 Origin、方法和请求头是否与实际业务请求一致。
4. 先读取真实响应状态和错误体，再处理被跨域提示掩盖的业务错误。

### 本地前端代理

Vite 开发服务器默认代理到 `http://api.lostsky.work`。本地 hosts 将该域名解析到开发机时，直接使用生产 `https://` 地址可能先命中本地证书或静态站点的兜底响应，浏览器随后把证书、404 或缺失响应头表现成 CORS 故障。

确实需要联调其他 API 时可设置 `VITE_DEV_API_TARGET` 覆盖代理目标；目标必须是完整 Origin，且应先直接检查预检与实际响应是否都由 ThinkPHP 返回。`npm run check:cors` 同时检查中间件顺序、响应头配置和本地代理默认值。

## 静态资源

静态资源由 Nginx 返回跨域响应头，不经过 API 中间件。配置、预检和验收命令统一见[静态资源 CORS](../operations/assets-cors.md)，不要将资源站规则复制到 API 站点。
