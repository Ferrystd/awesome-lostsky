---
title: 术语登记表
description: LostSky 专有名词单页文档的唯一登记入口。
tags: [glossary]
---

# 术语登记表

本表记录已进入产品、文档、接口或界面语言的专有名词。每一项必须有一个独立页面；不把多个概念合并进同一页，也不以接口字段、权限键或代码注释代替术语说明。

## 新增规则

1. 先确定一个稳定的中文名、英文名和页面文件名（小写连字符）。
2. 用 Obsidian Templater 的「术语单页模板」（`Templates/术语单页模板.md`）新建页面，或从[单页模板](template.md)对照结构；保留所有待人工补充的小节。
3. 在本表、[术语索引](index.md)和 `zensical.toml` 中加入该页面。
4. 完成定义前，将状态保留为“待编写”；不要用猜测性文字填充正文。

## 已建页面

| 中文名 | English | 分类 | 页面 | 状态 |
| --- | --- | --- | --- | --- |
| 实体 | Entity | 核心主体与标识 | [entity.md](entity.md) | 已建页 |
| 标识 | Slug | 核心主体与标识 | [slug.md](slug.md) | 已建页 |
| 团队 | Team | 核心主体与标识 | [team.md](team.md) | 已建页 |
| 顾客 | Customer | 核心主体与标识 | [customer.md](customer.md) | 已建页 |
| 虚拟实体 | Virtual | 核心主体与标识 | [virtual.md](virtual.md) | 已建页 |
| 团队成员 | Team Member | 核心主体与标识 | [team-member.md](team-member.md) | 已建页 |
| 团队顾客 | Team Customer | 核心主体与标识 | [team-customer.md](team-customer.md) | 已建页 |
| 角色 | Role | 访问控制 | [role.md](role.md) | 已建页 |
| 权限 | Permission | 访问控制 | [permission.md](permission.md) | 已建页 |
| 能力 | Ability | 访问控制 | [ability.md](ability.md) | 已建页 |
| 上下文 | Context | 访问控制 | [context.md](context.md) | 已建页 |
| 服务 | Service | 系统与通信 | [service.md](service.md) | 生成文档 |
| 通知 | Notice | 系统与通信 | [notice.md](../manual/glossary/notice.md) | 已建页 |
| 团队域名 | Team Domain | 系统与通信 | [team-domain.md](team-domain.md) | 已建页 |

## 待编写

人工新增术语时在此处建立一行，页面完成后移入“已建页面”。

`service.md` 由 `php think docs:services` 生成，状态固定为“生成文档”，禁止手改。
