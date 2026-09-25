---
title: 术语索引
description: LostSky 专有名词的单页索引。
tags: [glossary]
---

# 术语索引

本索引解释 LostSky 的共享语言。每个专有名词必须对应一个独立术语页；术语页说明概念本身，不替代代码、OpenAPI 或权限字典。

新增术语前先在[术语登记表](registry.md)登记，再从[单页模板](template.md)创建页面，并补入本索引与文档导航。尚未完成页面的术语不得作为正式产品术语对外使用。

## 核心主体与标识

- [实体（Entity）](entity.md)：团队业务中的当前执行主体。
- [标识（Slug）](slug.md)：实体的全局唯一、面向人阅读的标识。
- [团队成员（Team Member）](team-member.md)：与真实用户关联的团队内成员实体。
- [团队顾客（Team Customer）](team-customer.md)：团队的顾客实体，可关联真实用户。
- [团队（Team）](team.md)：资料与业务所属的工作空间，本身也是一种持久化实体。
- [顾客（Customer）](customer.md)：团队业务中的消费主体，由 teamCustomer 实体承载。
- [虚拟实体（Virtual）](virtual.md)：无真实账号、可配置 Webhook 接入的自动化主体。

## 访问控制

- [权限（Permission）](permission.md)：团队角色授予的细粒度授权键。
- [能力（Ability）](ability.md)：团队功能开通、等级与配额的能力标识。
- [上下文（Context）](context.md)：由当前身份补充到请求的可信业务上下文。
- [角色（Role）](role.md)：以 role_key 为稳定标识的一组权限载体。

## 系统与通信

- [服务（Service）](service.md)：由代码生成的 Service public 方法字典。
- [团队域名（Team Domain）](team-domain.md)：用于将自定义域名解析到团队的记录。
- [通知（Notice）](../apps/team.md#notification-mechanism)：区分实体收件箱中的“通知”和 Team 共享收件箱中的“站内通知”；独立开发术语页待补。

## 结构页

- [术语登记表](registry.md)：新增术语的唯一登记入口。
- [专有名词单页模板](template.md)：术语单页统一结构与新增流程。
