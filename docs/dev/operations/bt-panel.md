# 宝塔官方通道部署

首个 `1.0.0` 版本采用宝塔官方 MCP 管理面板资源，配套官方 `btpanel` Skill 说明操作流程；面板 API 作为无法使用 MCP 时的兼容通道。本文是 LostSky 的部署约束，不代表目标服务器已安装或已验收。

## 官方来源与项目安装

- [宝塔 MCP 介绍](https://docs.bt.cn/ai-ops/mcp)、[安装指引](https://docs.bt.cn/user-guide/ai/mcp-installation)及[工具说明](https://docs.bt.cn/ai-ops/mcp/tools-reference/)。
- [官方 Skill 接入说明](https://docs.bt.cn/ai-ops/agent/panel-integration)、[官方源码镜像](https://github.com/aaPanel/btpanel-skills)。
- [面板 API 设置](https://docs.bt.cn/user-guide/config/common/panel-api)及[API 文档](https://docs.bt.cn/api)。

官方 Skill 随源码保存在 `.agents/skills/btpanel/`，上游 commit 与逐文件校验记录见该目录的 `UPSTREAM.json`；保留上游 MIT 许可证。安装位置为项目级，不改变其他项目或用户级 Agent 配置。它提供运维流程，不随 PHP 应用启动，不会自行安装宝塔或连接服务器；刷新 Agent 会话后确认技能已被发现。

上游配套 Go、Java、Node.js、Python 等 Skill 资源保留在官方包中，不将它们自动另行安装为本项目部署方案。LostSky 后端仍按 ThinkPHP/PHP 站点部署，前端仍使用既有静态产物与 Nginx 模板。

## 新服务器接入

1. 确认新服务器、面板版本、部署域名、不可变发布标签及 commit SHA。依据[部署指南](deployment.md)检查运行时和目录布局；旧服务器不作为默认目标。
2. 管理员在宝塔软件商店安装官方「宝塔 MCP 服务」，按照官方安装指引配置可信 HTTPS、服务端口和 Agent 出口 IP 白名单；云防火墙与面板防火墙均只允许所需来源。
3. 将 MCP 服务地址与授权令牌通过 Agent 的私密配置或凭据入口接入。源码只保存官方 Skill 和流程，不保存目标地址、令牌、密码或私钥；不要在仓库配置文件中写入真实凭据。
4. 先查询 `SystemInfo`、`SoftwareList`、`ServiceStatus`、`SiteList`、`DatabaseList`、`GetCrontab`；记录返回的服务器身份与资源清单，并与本次目标核对。工具入参使用当前服务公布的 schema，不照搬其他面板版本的参数。
5. 验证证书链、有效期与 SAN，以及白名单和授权结果。连接失败先排查原因，不能关闭 TLS 校验或开放全网访问来绕过。

本项目通过已就绪的面板 MCP 接入，不默认调用上游 SSH 安装 helper，不生成或修改本机 SSH 密钥、SSH 配置及已有主机信任记录。需要安装面板、升级运行时或首次绑定客户端时，先单独确认目标和影响，再按官方 Skill 执行；未获该项授权时停在接入检查。

## 部署步骤与官方工具

下面的工具名称来自官方工具说明；目标面板没有对应能力时停止该步骤并记录缺项，不悄悄改用非官方 SDK、浏览器抓取或旧服务器。

| 阶段 | 官方 MCP 工具 | LostSky 验收条件 |
| --- | --- | --- |
| 盘点 | `SystemInfo`、`SoftwareList`、`ServiceStatus`、`SiteList`、`DatabaseList`、`GetCrontab` | 确认目标、运行时、现有资源与本次创建范围 |
| 备份 | `SiteBackup`、`DatabaseBackup` | 确认备份文件、实际完成状态、可恢复性；保留回滚所需身份与配置 |
| 站点与数据库 | `SiteCreate`、`DatabaseCreate`、`DomainManage` | 已存在资源先核对后复用；确认数据库及用户权限、域名和根目录 |
| 配置与证书 | `SiteGetConfig`、`SiteConfig`、`SiteSSLApply`、`SiteSSLDeploy`、`ProxyProjectInfo` | 采用仓库 Nginx 模板，验证 PHP 入口、静态目录、证书与 WebSocket 转发 |
| 传输与构建 | `Upload`、`Bash`、`BashStatus` | 校验交付包 SHA-256；部署命令成功退出，异步任务终态完成；不把已接收任务当成功 |
| 计划任务 | `GetCrontab`、`ManageCrontab` | 读取并核对命令、频率、PHP 路径、工作目录和目标环境，避免重复创建 |
| 复核 | `SiteList`、`SiteGetConfig`、`ServiceStatus`、`SiteLogs`、`ProxyProjectInfo` | 写后读取实际状态，再完成真实 HTTP、后台进程、证书和回滚验收 |

先完成站点、域名和目录绑定，再安装依赖并构建，避免宝塔默认首页覆盖发布产物。后端生产依赖安装先于前端与文档构建；按[发布须知](../development/releasing.md)执行 `composer install --no-dev --prefer-dist --no-interaction`、`npm ci`、`npm run docs:setup`、`npm run build`、`npm run build:docs`，最后确认完整 `www/` 入口。

新空库采用当前 `sql/schema.sql` 初始化，不自动叠加历史补丁；已有业务库按部署指南逐项核对升级路径并先备份。机密 `.env` 由目标环境的私密配置入口提供，构建与命令输出只报告脱敏结果。

常驻 `chat:worker`、Database Worker 与清理调度的具体命令、退出行为及保留规则遵循[部署指南的上线检查](deployment.md)和[控制台命令](console.md)，MCP 负责创建、查询和管理面板资源，不替代业务规则。涉及覆盖配置、切换目录、重启服务或数据库写入时先列明资源、影响和回退方法，按已确认的部署范围执行；失败保留现场，不循环覆盖或重复执行外部写操作。

## API 兼容通道

面板 API 从「设置 → 面板 API」开启，配置来源 IP 白名单。使用官方文档及对应面板版本的官方 Demo；请求为 POST 表单，包含时间戳和 `md5(request_time + md5(api_sk))` 签名，通过可信 HTTPS 发送。密钥从私密凭据入口读取，不放入命令行、URL、仓库或日志。

官方 API 文档注明接口可能随面板版本变化。使用前记录实际版本、核对当前接口并先做只读查询；不能因旧版接口失效自动尝试未公开写接口。MCP 的服务地址和授权令牌、面板 API 的密钥分别管理，不混用两套认证。

## 完成与回滚

部署记录包含发布标签、commit SHA、交付包 SHA-256、面板版本、目标身份、已授权动作、异步任务终态和写后复核结果。上线必须分别验证登录/真实短信、团队解析、PHP API、前端资源与 CORS、文档站、数据库、WebSocket、worker/scheduler，以及适用的真实 Webhook 接收端；本地模拟测试和 HTTPS echo 不能代替这些验收。

回滚保留前一已验证的不可变版本及数据库备份。目录、站点配置和进程恢复后再次验收；数据库恢复按已审阅方案操作，不假设 MySQL DDL 可整体回滚。未完成接入、生产验收或恢复验证时，在部署记录中明确标为未验证，不能称为已上线。
