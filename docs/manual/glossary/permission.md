---
title: 权限(Permission)
description: 团队角色授予实体的细粒度操作授权键。
tags: [glossary]
aliases: [权限, Permission]
---

# 权限(Permission)

## 定义

权限(Permission)是团队角色授予实体的细粒度操作键，决定某个受保护操作能否执行。

## 使用场景

一个角色包含多个权限；当前实体拥有的全部角色权限取并集，任一角色包含所需键即可通过。缺少权限时，页面会提示对应的 Permission 键，把它交给团队角色管理员即可定位原因。

## 不包括什么

- 不决定团队功能是否开通，那是[能力(Ability)](ability.md)的职责。
- 不是角色本身：角色是权限的载体，权限按角色授予。

## 相关概念

- [能力(Ability)](ability.md)划分团队功能边界，权限在操作层细粒度判断。
- [实体(Entity)](entity.md)是权限的业务主体。
- [角色(Role)](role.md)是权限的载体。

## 示例

`team.member.read` 允许查看成员，`team.member.update` 才允许修改成员。
