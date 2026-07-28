# OpenAPI Swagger 文档

本目录按 ThinkPHP 多应用拆分 OpenAPI 文件。项目通过域名或 Origin 解析 app，同一路径在不同 app 下可能表示不同接口，因此不合并为单个 `paths` 文件。

## 文件

- [`account.openapi.json`](account.openapi.json)：注册、登录、设备、用户团队入口
- [`display.openapi.json`](display.openapi.json)：团队主页、公开实体、公开文档与 Markdown 实体解析接口
- [`team.openapi.json`](team.openapi.json)：团队成员、成员/实体字段、岗位、设置、文件、虚拟实体与 Webhook 集成管理
- [`chat.openapi.json`](chat.openapi.json)：聊天身份、会话、消息、实时令牌与实体自助接口
- [`shop.openapi.json`](shop.openapi.json)：商品、订单、顾客自助中心
- [`transaction.openapi.json`](transaction.openapi.json)：记账流水、发单人绑定、余额充值
- [`common.openapi.json`](common.openapi.json)：公共上传入口

## 调用入口

每个 Swagger 文件都声明了三类 server：

- `https://api.lostsky.work`：通过 `Origin: https://{slug}.{app}.lostsky.work` 解析团队和 app
- `https://{slug}.{app}.api.lostsky.work`：通过 Host 直接解析团队和 app
- `https://{customDomain}`：通过 `team_domain` 反查团队和 app

## 通用约定

- 成功响应：`{ "code": 0, "message": "ok", "data": ... }`
- 业务错误：`{ "code": 非0, "message": "错误信息", "data": null }`
- 登录态：`Authorization: Bearer {token}`
- 防重复提交：写请求优先使用每次操作唯一的 `X-Request-Id`；`X-Page-Id + 请求内容` 用于兼容页面重复提交；两个请求头都缺省时服务端仍按登录主体、请求路径和请求内容生成短期防重键。有效期内重复请求返回 429。
- 公共上传：`common` 不能由 Origin 自动选择，调用 `/upload` 时必须显式发送 `X-LostSky-App: common`；团队仍由 Host 或 Origin 解析。
- 分页：`page >= 1`，`limit` 范围为 `1..100`。
- 金额：DECIMAL 金额统一返回和提交精确十进制字符串，最多两位小数；前端展示时可以格式化，但不得先转成浮点数再参与业务计算。
