---
title: 能力（Ability）
description: 团队功能开通、等级与配额的能力标识。
tags: [glossary]
status: 已建页
aliases: [能力, Ability]
---

# 能力（Ability）

## 定义

Ability 是团队功能开通、等级与配额的能力标识；实际有效性由授权记录、等级和有效期共同决定。

## 使用场景

校验团队(Team)是否开通了某能力，或是否达到一定等级，进而决定团队功能是否开放。

## 不包括什么

- 不做具体业务操作级别的细粒度授权判断（由 [Permission](permission.md) 承担）。
- 不代表功能是否开通或开通等级的存储记录，只表达功能边界。

## 相关概念

- [Permission](permission.md)处理团队角色的细粒度业务授权。
- [Context](context.md)提供 Ability 检查所需的当前实体与团队语境。

## 来源与示例

中间件组合与路由责任见[请求路由与应用解析](../architecture/routing.md)，具体检查点由各应用说明。Ability 不等于整个应用的入口许可：例如 Transaction 的入口和读取保持可用，只有登记流水、充值、权益下发和接受指定接单邀请等受保护提交检查能力；Shop 后台维护不要求 Shop Ability，公开陈列和购买才要求。File 未升级时仍有基础容量。
