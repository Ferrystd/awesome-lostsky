---
title: 团队域名（Team Domain）
description: 用于将自定义域名解析到团队的记录。
tags: [glossary]
status: 已建页
aliases: [团队域名, Team Domain]
---

# 团队域名（Team Domain）

## 定义

团队域名是关联到某个团队的自定义域名记录，用于将可信请求来源解析到对应团队。

## 使用场景

当请求使用自定义域名时，系统可通过团队域名反查团队；标准 LostSky 子域名和可信前端 Origin 也可以参与应用与团队解析。

## 不包括什么

- 不覆盖标准子域名与可信前端 Origin 的解析路径。
- 不充当应用解析的全部依据，只解决自定义域名的团队归属。

## 相关概念

- [Slug](slug.md)是团队与实体在标准域名、URL 和授权表达中使用的稳定标识。
- [Context](context.md)消费路由解析出的可信团队上下文。

## 来源与示例

解析边界见[请求路由与应用解析](../architecture/routing.md)，模型关联位于 `app/model/Team.php`。例如，`https://{customDomain}` 的 API 请求会由团队域名记录反查团队，而不是接受顾客端任意提交的团队 ID。
