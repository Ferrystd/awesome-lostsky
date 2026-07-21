# API CORS 边界

`api.lostsky.work` 的 CORS 由全局 `app\middleware\Cors` 中间件统一处理。前端站点或 Nginx 不应为 API 重复添加另一套 CORS 响应头。

## 处理原则

- 允许来源由 `config/cors.php` 配置。
- `allowed_headers` 可以配置为 `*`；预检响应会回显 `Access-Control-Request-Headers`，新增前端请求头不需要同步维护静态白名单。
- CORS 位于全局中间件链首部，预检请求可以在进入应用业务前返回。
- `app\ExceptionHandle` 也为异常响应补充 CORS 头，浏览器应能读取真实的 HTTP 状态和 JSON 错误信封。

## 故障定位

如果生产环境仍出现跨域错误：

1. 确认请求确实进入 ThinkPHP，而不是由 Nginx、CDN 或上游代理直接返回。
2. 检查响应中是否存在重复或互相冲突的 `Access-Control-Allow-Origin`。
3. 检查预检请求的 Origin、方法和请求头是否与实际业务请求一致。
4. 先读取真实响应状态和错误体，再处理被跨域提示掩盖的业务错误。

静态资源域名不经过后端中间件，其配置见 [`assets.lostsky.work` 静态资源 CORS](../operations/assets-cors.md)。
