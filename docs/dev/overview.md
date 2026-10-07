---
title: 项目概览
description: LostSky 的定位、核心能力与应用入口。
---

# 项目概览

LostSky 是面向小型数字服务工作室的运营与协作平台，把团队、成员、权限、内容和交易流程放进同一套可追踪的工作台，并提供公开主页与展示型商城。

## 核心能力

- 统一账号、设备会话与可撤销的 Entity 身份。
- 团队成员、资料字段、角色权限、加入审核、通知、文件和文档。
- 成员、顾客、团队与虚拟实体之间的聊天和 Webhook 集成。
- 记账、顾客余额、商品、订单和商城顾客中心。
- 微博账号、点单信息流、预设评论、超话单次操作、持续随机发帖与每日签到任务。
- 团队公开主页、公开实体资料与文档。

## 应用地图

| 应用 | 作用 |
| --- | --- |
| [Account](apps/account.md) | 注册、登录、设备、团队入口与身份切换 |
| [Admin](apps/admin.md) | 平台总览、用户与团队治理、平台 RBAC、审计和系统状态 |
| [Team](apps/team.md) | 团队后台与协作管理 |
| [Chat](apps/chat.md) | 当前 Entity 的跨团队会话、消息、群邀请与实时事件 |
| [Community](apps/community.md) | 公开主题社区、板块与内容互动，Team 管理团队社区、Admin 管理平台社区 |
| [Transaction](apps/transaction.md) | 流水、余额和经营统计 |
| [Shop](apps/shop.md) | 商品、订单、展示型商城与顾客中心 |
| [Weibo](apps/weibo.md) | 微博账号、点单信息流、预设评论、媒体、单次互动、自动发帖、每日签到与执行日志 |
| [Display](apps/display.md) | 团队公开主页、实体资料与文档 |
| [Common](apps/common.md) | 公共上传入口 |

接口路径和请求结构以 [OpenAPI](openapi/README.md) 为准；权限、团队上下文和路由机制见[架构文档](architecture/routing.md)。
