---
title: 标识(Slug)
description: 实体的全局唯一、稳定且面向人阅读的标识。
tags: [glossary]
aliases: [标识, Slug]
---

# 标识(Slug)

## 定义

标识(Slug)是实体全局唯一、稳定且面向人阅读的文本标识，例如 `alice`、`support-bot`。它用于精确找到实体，也会出现在地址与授权表达中。

## 使用场景

Slug 用于精确查找实体、表达动态权限目标，并参与团队与应用地址解析。

## 不包括什么

- 不是数据库外键或关联键。
- 不随界面文案的小改动而变更，是长期稳定标识。

## 相关概念

- [实体(Entity)](entity.md)以 slug 获得全局可识别身份。
- [权限(Permission)](permission.md)可以用 `identity.member.<slug>.assume` 这样的精确规则。

## 示例

`identity.member.bob.assume` 只允许领取 slug 为 `bob` 的成员，不能匹配其他成员。
