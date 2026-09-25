---
title: 实体（Entity）
description: 团队业务中的当前执行主体。
tags: [glossary]
status: 已建页
aliases: [实体, Entity]
---

# 实体（Entity）

## 定义

Entity 是 LostSky 团队业务中的当前执行主体。真实 `user` 负责登录、设备和审计；业务操作以当前 Entity 的身份完成。

## 使用场景

成员、顾客、团队和虚拟实体都可以具有 Entity 身份。一个实体可在授权后领取另一个实体身份，但真实用户与设备审计不会丢失。

## 不包括什么

- 不替代真实用户：登录、设备与审计仍以真实 `user` 为准。
- 不是某个固定实体类型：成员、顾客、团队与虚拟实体各有底层模型承载。

## 相关概念

- [团队成员](team-member.md)与[团队顾客](team-customer.md)是常见实体类型。
- [Context](context.md)从当前实体补充业务身份。
- [Permission](permission.md)决定实体是否可以执行受保护的业务操作。

## 来源与示例

实体授权链路见[实体身份与跨团队委托](../architecture/entity-authorization.md)；持久化模型位于 `app/model/Entity.php`。例如，成员实体领取顾客实体后，交易操作以该顾客身份执行，而审计仍可追溯到真实用户。
