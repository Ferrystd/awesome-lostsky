# assets.lostsky.work 静态资源 CORS

`api.lostsky.work` 的 CORS 由 ThinkPHP 全局 `Cors` 中间件负责。本配置只用于宝塔面板中的 `assets.lostsky.work` 静态站点，不能复制到 API 站点。

构建产物使用 `//assets.lostsky.work/...` 协议相对地址：HTTP 页面会访问 80，HTTPS 页面会访问 443。因此生产站点启用 HTTPS 时，必须同时为 `assets.lostsky.work` 配置有效证书和 443 监听，否则浏览器会报告 `ERR_CONNECTION_CLOSED` 或 `ERR_CONNECTION_REFUSED`。

在宝塔「网站 → assets.lostsky.work → 配置文件」对应的 `server {}` 中加入：

```nginx
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
add_header Access-Control-Allow-Headers "Range, If-None-Match, If-Modified-Since" always;
add_header Access-Control-Expose-Headers "Content-Length, Content-Range, ETag" always;
add_header Cross-Origin-Resource-Policy "cross-origin" always;

if ($request_method = OPTIONS) {
    return 204;
}
```

如果已有单独的音视频 `location`，该 `location` 中也需要重复响应头，因为 Nginx 的 `add_header` 会被子级配置覆盖：

```nginx
location ~* \.(mp4|webm|ogg)$ {
    try_files $uri =404;
    add_header Accept-Ranges "bytes" always;
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Expose-Headers "Content-Length, Content-Range, ETag" always;
    add_header Cross-Origin-Resource-Policy "cross-origin" always;
    expires 30d;
}
```

保存后在宝塔重载 Nginx，并清理 `assets.lostsky.work` 的 CDN 缓存。线上验证：

```bash
curl -I -H "Origin: https://account.lostsky.work" https://assets.lostsky.work/build/account/任意现有模块.js
curl -I -H "Origin: https://demo.team.lostsky.work" -H "Range: bytes=0-1023" https://assets.lostsky.work/media/site/lostsky-loop.webm
```

响应应包含 `Access-Control-Allow-Origin: *` 和 `Cross-Origin-Resource-Policy: cross-origin`；视频响应还应包含 `Accept-Ranges: bytes`。
