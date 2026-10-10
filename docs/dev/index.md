---
title: LostSky 开发文档
description: LostSky 的产品、设计、应用、架构、开发、运维、接口与计划文档。
---

# LostSky 开发文档

开发文档统一位于 `docs/dev/`，由 `docs.lostsky.work` 独立发布；用户文档统一位于 `docs/user/`，由 [doc.lostsky.work](https://doc.lostsky.work/) 独立发布。

`docs/dev/` 由 AI 维护，`docs/user/` 由人工维护。AI 可只读参考用户文档并反馈差异，不自动改写或双向同步。具体分工与核验流程见[文档管理与发布](development/wiki.md)。

## 按任务阅读

| 当前任务 | 阅读顺序 |
| --- | --- |
| 首次参与开发 | [开始使用](getting-started.md) → [开发环境](development/development.md) → [贡献与工作区保护](development/contributing.md) |
| 修改业务或接口 | [应用地图](overview.md) → 对应应用正文 → [授权机制](architecture/entity-authorization.md)与 [OpenAPI](openapi/README.md) → [更新清单](development/checklist.md) |
| 修改后台界面 | [产品定义](product.md) → [设计系统](design.md) → [后台规范](design/admin/index.md) → [前端约定](development/frontend.md)与[测试须知](development/testing.md) |
| 部署或排错 | [发布须知](development/releasing.md) → [部署与迁移](operations/deployment.md) → [系统日志](operations/logging.md)与[控制台命令](operations/console.md) |
| 维护文档 | [文档管理与发布](development/wiki.md) → 对应领域正文；未完成事项进入[待办](TODO.md)，已发布事实保留在[版本历史](changelog.md) |

## 项目

- [产品定义](product.md)
- [设计系统](design.md)
- [后台设计规范](design/admin/index.md)
- [项目概览](overview.md)
- [Community 社区](apps/community.md)
- [开始使用](getting-started.md)
- [用户文档](https://doc.lostsky.work/)
- [最近更新](updates.md)
- [完整变更日志](changelog.md)

## 参考

- [开发术语索引](glossary/index.md)
- [路由与应用上下文](architecture/routing.md)
- [前端路由与页面间导航](architecture/frontend-navigation.md)
- [Entity 身份与跨团队委托](architecture/entity-authorization.md)
- [权限与能力](architecture/permissions.md)
- [API CORS](architecture/cors.md)
- [OpenAPI](openapi/README.md)

## 参与项目

- [贡献指南](development/contributing.md)
- [任务拆分与自动分支](development/contributing.md#task-orchestration)
- [开发须知](development/development.md)
- [代码更新清单](development/checklist.md)
- [后端约定](development/backend.md)
- [Webhook 协议](development/webhooks.md) · [最小 SDK 接入](development/webhook-quickstart.md)
- [外部写操作与日志保留](development/external-write-operations.md)
- [前端约定](development/frontend.md)
- [组件代码预览](development/component-previews.md)
- [测试须知](development/testing.md)
- [发布须知](development/releasing.md)
- [文档管理与发布](development/wiki.md)

## 运维

- [生产与宝塔部署](operations/deployment.md)
- [宝塔官方通道部署](operations/bt-panel.md)
- [系统运行日志](operations/logging.md)
- [静态资源 CORS](operations/assets-cors.md)
- [控制台命令](operations/console.md)

## 计划

- [当前待办](TODO.md)
- [Markdown 编辑器 AI 能力](plans/markdown-ai.md)
- [非 Team 页面一致性保留计划](plans/non-team-page-consistency.md)
