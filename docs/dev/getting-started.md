---
title: 开始使用
description: 开发者从环境、应用边界和验证流程开始参与 LostSky。
---

# 开始使用

本页面向开发者。产品操作从人工维护的[用户文档](https://doc.lostsky.work/)开始；应用定位和入口见[项目概览](overview.md)。

## 参与开发

1. 阅读[开发须知](development/development.md)，按锁文件安装依赖，配置本地 API、空库或适用的增量补丁。
2. 从[项目概览](overview.md)选择目标应用，再查看对应应用正文和 [OpenAPI](openapi/README.md)。
3. 阅读[贡献指南](development/contributing.md)，记录已有工作区差异；按[更新清单](development/checklist.md)确定需要同步的实现、契约与文档。
4. 按[测试须知](development/testing.md)选择与本次改动相符的验证；前端改动遵守[前端约定](development/frontend.md)，文档改动遵守[文档管理与发布](development/wiki.md)。

LostSky 的业务权限归属于当前 Entity，账号登录不等于取得团队业务授权；跨应用开发前阅读 [Entity 身份与跨团队委托](architecture/entity-authorization.md)与[权限机制](architecture/permissions.md)。

常见技术概念可从[开发术语索引](glossary/index.md)查询；版本变化见[最近更新](updates.md)，正式交付与回滚按[发布须知](development/releasing.md)执行。本地测试或构建成功不表示已经部署。
