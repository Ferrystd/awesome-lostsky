---
title: 权限（Permission）
description: 团队角色授予的细粒度授权键。
tags: [glossary]
status: 已建页
aliases: [权限, Permission]
---

# 权限（Permission）

## 定义

Permission 是团队角色授予 Entity 的细粒度授权键，用于决定一个受保护操作是否允许执行。

## 使用场景

角色可以包含多个 Permission；当前实体拥有的角色权限取并集。固定权限由代码中的权限字典定义，部分动态权限以目标实体 slug 表达。

## 不包括什么

- 不划分应用级功能边界（由 [Ability](ability.md) 负责）。
- 不包含角色本身：角色是权限的载体，权限按角色授予。

## 相关概念

- [Ability](ability.md)划分应用级功能边界；Permission 在业务操作层作细粒度判断。
- [Entity](entity.md)是 Permission 的业务主体。

## 来源与示例

完整键与约束见[权限字典](../architecture/permissions.md)，执行入口位于 `app/middleware/Permission.php`。例如 `team.member.read` 允许查看成员，`team.member.update` 才允许修改成员。
