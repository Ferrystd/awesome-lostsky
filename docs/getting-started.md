---
title: 开始使用
description: 从产品入口、开发环境或 API 快速认识 LostSky。
---

# 开始使用

## 使用产品

1. 在 Account 注册或登录统一账号。
2. 创建团队，或加入已有团队。
3. 领取当前团队的成员或顾客身份，再进入 Team、Chat、Transaction 或 Shop。
4. 通过 `{team}.display.lostsky.work` 查看公开主页，通过 `{team}.shop.lostsky.work` 访问团队商城。

具体操作和功能边界从[使用手册](manual/index.md)开始。LostSky 的业务权限归属于当前 Entity，而不是仅由登录账号决定；需要理解技术授权规则时，再读 [Entity 身份与跨团队委托](architecture/entity-authorization.md)和[权限字典](architecture/permissions.md)。

## 参与开发

1. 阅读[开发须知](development/development.md)并安装 PHP、Composer、Node.js 与数据库依赖。
2. 从[项目概览](overview.md)定位应用边界，再查看对应 [OpenAPI](openapi/README.md)。
3. 按[测试须知](development/testing.md)选择最小验证。

常见概念可从[术语索引](manual/glossary/index.md)查询；版本变化见[最近更新](updates.md)。
