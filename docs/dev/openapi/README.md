# OpenAPI Swagger 文档

本目录按 ThinkPHP 多应用拆分 OpenAPI 文件。项目通过域名或 Origin 解析 app，同一路径在不同 app 下可能表示不同接口，因此不合并为单个 `paths` 文件。

## 文件

- [`account.openapi.json`](account.openapi.json)：注册、登录、设备、用户团队、身份切换与旧深链目标解析
- [`admin.openapi.json`](admin.openapi.json)：平台管理员、用户与团队治理、审计和系统状态
- [`display.openapi.json`](display.openapi.json)：团队主页、公开实体、公开文档与 Markdown 实体解析接口
- [`team.openapi.json`](team.openapi.json)：团队工作台与 Team/成员/虚拟 Entity 个人工作台
- [`chat.openapi.json`](chat.openapi.json)：teamless Chat 的当前 Entity、会话、邀请、屏蔽、消息与 EntitySession 实时令牌
- [`community.openapi.json`](community.openapi.json)：无团队社区的公开浏览、互动和管理接口
- [`shop.openapi.json`](shop.openapi.json)：商品、订单、顾客自助中心
- [`transaction.openapi.json`](transaction.openapi.json)：记账流水、余额充值、统计、权益下发与核销；发单协作关系由 Team 顾客接口维护
- [`weibo.openapi.json`](weibo.openapi.json)：微博账号、点单信息流、预设评论、媒体、单次写操作、自动发帖、每日签到与 30 天执行日志
- [`common.openapi.json`](common.openapi.json)：公共上传入口

这些 JSON 是接口契约正文。前端类型由 `openapi-typescript` 从各应用契约生成到 `frontend/packages/api/src/generated/`，接口结构变更后在项目根目录运行 `npm run generate:api`，并把生成文件与契约一起核对；不要直接手改生成类型。

## 调用入口

团队应用可通过以下三类入口解析上下文；各文件实际声明的 server 以其 `servers` 为准，不能假定每个应用都支持全部示例：

- `https://api.lostsky.work`：通过 `Origin: https://{slug}.{app}.lostsky.work` 解析团队和 app
- `https://{slug}.{app}.api.lostsky.work`：通过 Host 直接解析团队和 app
- `https://{customDomain}`：通过 `team_domain` 反查团队和 app

Account 与 Admin 是无团队应用，使用公共 API 时分别发送 `Origin: https://account.lostsky.work` 或 `Origin: https://admin.lostsky.work`，不要求团队 slug。完整解析规则见[请求路由与应用解析](../architecture/routing.md)。

## 通用约定

- 成功响应：`{ "code": 0, "message": "ok", "data": ... }`
- 业务错误：`{ "code": 非0, "message": "错误信息", "data": null }`
- 登录态：`Authorization: Bearer {token}`
- 防重复提交：写请求优先使用每次操作唯一的 `X-Request-Id`；`X-Page-Id + 请求内容` 用于兼容页面重复提交；两个请求头都缺省时服务端仍按登录主体、请求路径和请求内容生成短期防重键。有效期内重复请求返回 429。
- 公共上传：`common` 不能由 Origin 自动选择，调用 `/upload` 时必须显式发送 `X-LostSky-App: common`；团队仍由 Host 或 Origin 解析。
- 当前实体写入：Chat 全部写请求、Team `/personal/*` 与 Shop `/personal/products*` 写请求必须携带 `expected_entity_id`；与当前 JWT 叶子 Entity 不一致时返回 `409`，不得回退到真实账号或父级会话。Shop Customer 使用客户中心专用接口。
- 分页：`page >= 1`，`limit` 范围为 `1..100`。
- 金额：DECIMAL 金额统一返回和提交精确十进制字符串，最多两位小数；前端展示时可以格式化，但不得先转成浮点数再参与业务计算。

调用前先确认目标文件的 `servers`、路径和 `security` 声明；同一 API Host 下不能仅凭 URL 路径猜测应用。契约变更后还需同步对应路由、请求校验、响应 DTO 和客户端生成类型，文档站构建由[文档管理与发布](../development/wiki.md)统一执行。
