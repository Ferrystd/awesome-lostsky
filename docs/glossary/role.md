---
title: 角色（Role）
description: 以 role_key 为稳定标识的一组权限载体。
tags: [glossary]
status: 已建页
aliases: [角色, Role]
---

# 角色（Role）

## 定义

角色是一组 Permission 的载体，以 `role_key` 作为稳定标识。角色可以分配给团队内实体，也可以通过全局 slug 分配给外部来源实体。

## 使用场景

成员拥有多个角色时，有效 Permission 取并集，没有拒绝覆盖。编辑角色只允许修改名称、说明、排序和是否在 Display 展示；删除角色时服务层同步软删除角色权限与成员角色绑定，并立即影响依赖它的操作与后续身份委托。

## 不包括什么

- 不包含具体业务授权判断逻辑（由 [Permission](permission.md) 承担）。
- 不是账号或实体类型，本身不能执行业务操作。

## 相关概念

- [Permission](permission.md)是角色的内容。
- [Entity](entity.md)是角色的授予对象。
- [Ability](ability.md)在应用级决定团队功能是否开通，与角色权限独立。

## 来源与示例

角色模型与授权关系见[权限字典](../architecture/permissions.md)与 `app/model/TeamRole.php`。例如，新建团队自动创建 `owner` 角色，并授予创建者的成员实体和团队实体当前权限目录的全部权限。
