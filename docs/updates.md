---
title: 最近更新
description: LostSky 最近开发版本与已发布版本的重点变化。
---

# 最近更新

本页只保留最近两个版本的摘要，完整记录见[变更日志](changelog.md)。

## v0.1.6（2026-08-14）

- Shop 与 Transaction 完成个人工作台资源、自助权益赠送与服务履约协作，个人读取按当前 Entity 隔离。
- 新增 Shop Ability、有限期 Ability 自动降级及商城实时关闸，商品、权益和核销设置统一管理。
- Team 审计日志、系统日志、客户上传及 OSS 匿名只读发布完成联动。
- 修复服务分成与金额校准、Transaction 深层路由、后台表单状态及工作台入口层级。

## v0.1.5（2026-08-07）

- Team、Shop 与 Transaction 新增个人/团队工作台，六个工作台固定概览入口并支持双向切换。
- Account 实体自管迁入 Team 个人工作台，客户资料继续由商城客户中心承载。
- Shop 商家后台、Transaction 服务收款与核销、Ability 权益和公开实体目录完成联动。
- 权限域完成开发期硬切换，个人业务查询按当前 `acting_entity` 强制隔离。
