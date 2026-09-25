---
title: 顾客（Customer）
description: 团队业务中的消费主体，由 teamCustomer 实体承载。
tags: [glossary]
status: 已建页
aliases: [顾客, Customer]
---

# 顾客（Customer）

## 定义

顾客是 LostSky 团队业务中的消费主体，由服务端自动创建的 `teamCustomer` 实体承载。它可以与真实用户关联，也可以由其他有效实体派生，其业务身份独立于登录账号。

## 使用场景

顾客用于商城下单、预存余额、订单、流水、会话和服务核销等业务。顾客绑定同时创建零余额记录和不可搜索的 `teamCustomer` 实体：基础用户绑定存 `user_id`，外部 Entity 绑定存 `owner_entity_id`，两者严格二选一。服务权益与履约记录归顾客根 Entity，不归登录 User。

## 不包括什么

- 不是登录账号：真实用户仍以统一账号登录，再领取或派生顾客身份。
- 不同商家的顾客资料、余额与订单相互隔离；同一来源同一商家只绑定一个顾客，不可转移。

## 相关概念

- [团队顾客](team-customer.md)是顾客的实体形态，承载资料、余额与归属。
- [实体](entity.md)定义顾客作为当前业务主体的方式。
- [Context](context.md)把当前顾客写入请求业务上下文。

## 来源与示例

顾客实体模型与绑定规则见[实体身份与跨团队委托](../architecture/entity-authorization.md)与 `app/model/TeamCustomer.php`。例如，顾客通过商城首次绑定后获得零余额的 `teamCustomer` 实体，此后下单、余额与权益均以该顾客实体为业务主体。
