---
title: 能力（Ability）
description: 应用级功能边界与路由访问能力。
tags: [glossary]
status: 已建页
aliases: [能力, Ability]
---

# 能力（Ability）

## 定义

团队(Team)功能边界的能力标识

## 使用场景

校验团队(Team)是否开通了某能力，或是否达到一定等级，进而决定团队功能是否开放。

## 不包括什么

- 不做具体业务操作级别的细粒度授权判断（由 [Permission](permission.md) 承担）。
- 不代表功能是否开通或开通等级的存储记录，只表达功能边界。

## 相关概念

- [Permission](permission.md)处理团队角色的细粒度业务授权。
- [Context](context.md)提供 Ability 检查所需的当前实体与团队语境。

## 来源与示例

中间件组合与路由责任见[请求路由与应用解析](../architecture/routing.md)。例如交易应用可在路由上要求对应 Ability，再由后续授权检查约束具体操作。
