# LostSky 项目文档

本目录记录 LostSky 的现行应用边界、后端架构、开发命令、运维配置和后续计划。

接口路径、请求参数和响应结构以 [`openapi/`](openapi/README.md) 中的 OpenAPI 文件为准；应用文档只说明稳定的业务职责、鉴权边界和关键流程。实现与文档不一致时，应以当前代码为依据核对并同步更新文档。

## 应用

- [`account`](apps/account.md)：注册、登录、设备会话和用户的团队入口。
- [`display`](apps/display.md)：无需登录的团队与成员公开展示。
- [`team`](apps/team.md)：团队成员、角色、资料、设置、文件、文档和加入审核。
- [`shop`](apps/shop.md)：商品、订单和顾客自助中心。
- [`transaction`](apps/transaction.md)：记账流水、发单人绑定和预存款。

## 架构

- [请求路由与应用解析](architecture/routing.md)
- [API CORS 边界](architecture/cors.md)

## 开发

- [`make:model` 模型生成命令](development/make-model.md)

## 运维

- [`assets.lostsky.work` 静态资源 CORS](operations/assets-cors.md)
- [控制台命令](operations/console.md)

## 计划

以下文档描述尚未实现或尚未启用的能力，不能作为现行接口说明：

- [当前开发待办](TODO.md)
- [Markdown 编辑器 AI 能力](plans/markdown-ai.md)
- [卡密、订阅与资产交易](plans/trade.md)
- [微博机器人](plans/weibo-bot.md)

## API

- [OpenAPI 文档说明](openapi/README.md)
- `openapi/*.openapi.json`：各应用的接口契约，也是前端 API 类型的生成来源。
