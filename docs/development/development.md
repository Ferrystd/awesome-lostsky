# 开发须知

## 准备环境

需要 PHP 8.1+、MySQL 5.7+ 或 MariaDB 10.3+、Composer 2、Node.js LTS：

```bash
composer install
npm ci
cp .env.example .env
```

导入 `sql/schema.sql`，API 站点目录指向 `public/`。

## 专题

- [代码更新清单](checklist.md)：改动后需要同步的文件与命令。
- [后端约定](backend.md)：分层、数据、安全与外部系统。
- [前端约定](frontend.md)：组件、接口、交互与构建。
- [测试须知](testing.md)：验证范围与数据库保护。
- [路由](../architecture/routing.md)、[权限](../architecture/permissions.md)、[OpenAPI](../openapi/README.md)。

> 能从Github找项目使用/借鉴，就不要重复造轮子！！！

## 本地联调

```bash
python tests/hosts.py <app> [slug]
npm run dev:<app> -- --host 127.0.0.1
```

HMR 端口：`site 5173`、`account 5174`、`team 5175`、`chat 5176`、`transaction 5177`、`display 5178`、`shop 5179`、`admin 5180`、`weibo 5181`。具体配置见 `frontend/vite.<app>.ts`。

本地 Vite 默认把 `/api` 代理到 `http://api.lostsky.work`，与 `tests/hosts.py` 配置的本地 API 虚拟主机一致；需要连接其他开发 API 时通过 `VITE_DEV_API_TARGET` 显式覆盖。不要把默认目标改成生产 HTTPS 地址，否则本地证书或静态站点兜底会把真实 API 错误伪装成 CORS。
