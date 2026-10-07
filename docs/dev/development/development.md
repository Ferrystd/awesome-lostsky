# 开发须知

## 准备环境

需要 PHP 8.1+、MySQL 5.7+ 或 MariaDB 10.3+、Composer 2、Node.js LTS。PHP 扩展以 `composer check-platform-reqs` 为准，依赖使用仓库锁文件安装。在项目根目录执行：

```bash
composer install
npm ci
```

首次初始化且 `.env` 不存在时，从 `.env.example` 复制并配置本地数据库和所需服务；已有 `.env` 不覆盖，不将其中凭据提交或贴入日志。

仅对新建空库导入 `sql/schema.sql`；已有数据库按[部署指南](../operations/deployment.md)核对并执行适用的 `sql/patches/` 增量补丁，禁止重新导入完整 schema。API 虚拟主机目录指向 `public/`，伪静态、后台进程和外部服务按部署指南配置；Vite 只启动前端，不会启动 PHP API 或后台任务。

编辑或构建文档还需 Python 3.12+，首次运行 `npm run docs:setup`；命令和双站边界见[文档管理与发布](wiki.md)。

## 专题

- [代码更新清单](checklist.md)：改动后需要同步的文件与命令。
- [后端约定](backend.md)：分层、数据、安全与外部系统。
- [前端约定](frontend.md)：组件、接口、交互与构建。
- [测试须知](testing.md)：验证范围与数据库保护。
- [路由](../architecture/routing.md)、[权限](../architecture/permissions.md)、[OpenAPI](../openapi/README.md)。

优先复用仓库现有服务、公共组件与成熟依赖；引入外部实现前确认许可证、维护状态和现有技术栈兼容性。

## 本地联调

```bash
python tests/hosts.py <app> [slug]
python tests/hosts.py api
npm run dev:<app> -- --host 127.0.0.1
```

`<app>` 替换为下面列出的应用名（官网使用 `dev:site`，hosts 名称使用 `www`），`slug` 仅用于团队子域名。`tests/hosts.py` 会写入系统 hosts，需要管理员/root 权限；它只补充缺失名称，不纠正已有错误映射。浏览器使用相应业务域名及 Vite 端口，先确认本地 API 虚拟主机可达。自动化 E2E 使用自己的本地映射，无需执行 hosts 脚本，见[测试就绪检查](testing.md#e2e-domain-readiness)。

HMR 端口：`site 5173`、`account 5174`、`team 5175`、`chat 5176`、`transaction 5177`、`display 5178`、`shop 5179`、`admin 5180`、`weibo 5181`、`community 5182`。具体配置见 `frontend/vite.<app>.ts`。

本地 Vite 默认把 `/api` 代理到 `http://api.lostsky.work`，与 `tests/hosts.py` 配置的本地 API 虚拟主机一致；需要连接其他开发 API 时通过 `VITE_DEV_API_TARGET` 显式覆盖。不要把默认目标改成生产 HTTPS 地址，否则本地证书或静态站点兜底会把真实 API 错误伪装成 CORS。
