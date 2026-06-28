# OpenAPI Swagger 文档

本目录按 ThinkPHP 多应用拆分 OpenAPI 文件。项目通过域名或 Origin 解析 app，同一路径在不同 app 下可能表示不同接口，例如 `team` 和 `display` 都有 `GET /member/index`，所以不合并为单个 `paths` 文件。

## 文件

- `account.openapi.json`：注册、登录、设备、用户团队入口
- `display.openapi.json`：公开展示接口
- `team.openapi.json`：团队成员、成员字段、岗位、设置、文件管理
- `shop.openapi.json`：商品、订单、顾客自助中心
- `transaction.openapi.json`：记账流水、发单人绑定、余额充值
- `common.openapi.json`：上传、文档

## 调用入口

每个 Swagger 文件都声明了三类 server：

- `https://api.lostsky.work`：通过 `Origin: https://{slug}.{app}.lostsky.work` 解析团队和 app
- `https://{slug}.{app}.api.lostsky.work`：通过 Host 直接解析团队和 app
- `https://{customDomain}`：通过 `team_domain` 反查团队和 app

## 通用约定

- 成功响应：`{ "code": 0, "message": "ok", "data": ... }`
- 业务错误：`{ "code": 非0, "message": "错误信息", "data": null }`
- 登录态：`Authorization: Bearer {token}`
- 防重复提交：可选请求头 `X-Page-Id`。携带后，同页面同请求在有效期内重复提交会返回 429。
