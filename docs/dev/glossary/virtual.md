---
title: 虚拟实体（Virtual）
description: 无真实账号、可配置 Webhook 接入的自动化主体。
tags: [glossary]
status: 已建页
aliases: [虚拟实体, Virtual]
---

# 虚拟实体（Virtual）

## 定义

虚拟实体是没有真实账号的自动化主体（`teamVirtual`），用于人工代操作、Webhook、机器人或外部工作流。

## 使用场景

虚拟实体可配置 Webhook 凭据接入 Chat，以凭据绑定的虚拟实体参与已加入的会话。其他实体可凭 `identity.virtual.*.assume` 或精确 slug 权限在 Account 领取虚拟实体身份；Chat 始终使用当前 Entity，不再提供独立代操作身份。

## 不包括什么

- 不能使用账号密码登录。
- 不承担真实用户认证与审计职责；代操作仍可追溯到认证用户与设备。

## 相关概念

- [实体](entity.md)定义虚拟实体作为业务主体的统一方式。
- [标识](slug.md)用于虚拟实体的全局识别与精确授权。
- [团队成员](team-member.md)是常见的代操作来源。

## 来源与示例

实体类型与权限见[实体身份与跨团队委托](../architecture/entity-authorization.md)与[权限字典](../architecture/permissions.md)。例如 `identity.virtual.support-bot.assume` 允许领取 `@support-bot` 虚拟实体身份，再以该身份进入 Chat。
