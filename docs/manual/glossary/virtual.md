---
title: 虚拟实体(Virtual)
description: 没有真实账号、可配置 Webhook 接入的自动化主体。
tags: [glossary]
aliases: [虚拟实体, Virtual]
---

# 虚拟实体(Virtual)

## 定义

虚拟实体是没有真实账号的自动化主体，用于机器人、外部工作流或人工代为操作。

## 使用场景

虚拟实体可配置 Webhook 凭据接入聊天，代表所属虚拟实体参与已加入的会话。其他实体可在被授权后领取虚拟实体身份；也可以只代表虚拟实体发言，而不切换当前身份。

## 不包括什么

- 不能用账号密码登录。
- 不承担真实用户认证与审计；代为操作仍可追溯到认证账号与设备。

## 相关概念

- [实体(Entity)](entity.md)定义虚拟实体作为业务主体的统一方式。
- [标识(Slug)](slug.md)用于虚拟实体的全局识别与精确授权。
- [团队成员(Team Member)](team-member.md)是常见的代为操作来源。

## 示例

成员获得 `identity.virtual.support-bot.assume` 后可领取 `@support-bot` 虚拟实体身份；`chat.virtual.<slug>.act` 则允许代表虚拟实体发言而不切换身份。
