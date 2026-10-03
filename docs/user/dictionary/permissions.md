---
title: 权限字典
description: 提供全部权限的对照。
audience:
  - team
tags:
  - 权限
modified_at: 2026-10-03
---

# 权限字典

## 简述

1. 权限生效取并集
2. 权限生效前提是资源归团队管辖
3. 父级权限包含所有子级权限
## 团队权限

| 分组 | Permission | 允许的操作与范围 |
| --- | --- | --- |
| 团队成员 | `team.member.read` | 查看完整成员管理集合，包括团队内隐藏或封禁成员；基础目录不要求此权限 |
| 团队成员 | `team.member.invite` | 邀请或新增成员 |
| 团队成员 | `team.member.update` | 编辑、封禁、解封、设置 slug 与搜索成员 |
| 团队成员 | `team.member.remove` | 查询、批准和拒绝成员离队申请，以及直接办理离职；保留成员和业务历史 |
| 团队成员 | `team.role.read` | 查看角色、权限和角色分配 |
| 团队成员 | `team.role.write` | 管理角色、权限和角色分配 |
| 顾客 | `team.customer.read` | 查看当前团队全部顾客；无此权限的归属实体仍只能查看自己的顾客 |
| 顾客 | `team.customer.manage` | 管理顾客资料、当前归属、协作发单人与封禁状态，并包含全量顾客读取 |
| 加入审核 | `team.join_field.read` | 查看加入申请字段 |
| 加入审核 | `team.join_field.write` | 管理加入申请字段 |
| 加入审核 | `team.join_review.read` | 查看加入申请 |
| 加入审核 | `team.join_review.write` | 审核申请及维护审核任务 |
| 商店 | `shop.product.read` | 查看商品 |
| 商店 | `shop.product.write` | 创建、编辑商品和配置处理人 |
| 商店 | `shop.product.delete` | 删除商品 |
| 商店 | `shop.product.self.manage` | 管理当前 Entity 本人服务、权益包、卡活动、卡密与商品 |
| 商店 | `shop.product.self.reprice` | 调整本人商品、服务及权益包服务项的人员分成，并调整本人权益包内公用服务的价格、成本；不由本人资源管理权限隐式包含 |
| 商店 | `shop.order.read` | 查看订单 |
| 商店 | `shop.order.write` | 创建、取消和完成订单 |
| 交易 | `transaction.read` | 查看团队全量流水、余额日志、发单人和交易选项；本人相关读取不依赖此权限 |
| 交易 | `transaction.write` | 创建或编辑流水、充值及团队手动赋予权益；顾客协作关系由 `team.customer.manage` 维护 |
| 交易 | `transaction.delete` | 删除流水 |
| 交易 | `transaction.report.read` | 查看团队全量交易统计报表；“我的流水”中的个人统计不依赖此权限 |
| 交易 | `service.entitlement.grant` | 在个人工作台为当前 Entity 接待的顾客赋予服务权益 |
| 交易 | `service.redemption.read` | 进入团队服务核销并查看全量列表、详情与接单池 |
| 交易 | `service.redemption.manage` | 查看团队全量核销，并允许改派、处理取消、确认完成与调整费用 |
| 文档管理 | `team.document.read` | 查看团队全部文档，包括当前 Entity 按可见性无法读取的文档；基础文档入口不要求此权限 |
| 文档管理 | `team.document.team.manage` | 管理归属于团队人员的文档 |
| 文档管理 | `team.document.member.*.manage` | 管理当前团队全部成员实体的文档 |
| 文档管理 | `team.document.customer.*.manage` | 管理当前团队全部顾客实体的文档 |
| 文档管理 | `team.document.virtual.*.manage` | 管理当前团队全部虚拟实体的文档 |
| 文件与设置 | `file.read` | 查看团队文件与用量 |
| 文件与设置 | `file.upload` | 通过团队文件库上传团队文件；资源附件上传只受 File Ability 与所属资源编辑鉴权控制 |
| 文件与设置 | `file.delete` | 删除团队文件 |
| 文件与设置 | `team.setting.read` | 查看团队设置及设置结构 |
| 文件与设置 | `team.setting.update` | 修改团队设置 |
| 文件与设置 | `team.ability.redeem` | 兑换团队能力（卡密或体验码） |
| 通知 | `team.notice.read` | 查看 LostSky 发给团队的共享站内通知 |
| 通知 | `team.notice.send` | 以团队名义向同团队人员发送单向通知 |
| 安全与审计 | `team.audit.read` | 查看当前团队审计日志 |
| 人员管理 | `team.entity.read` | 查看全部有效实体，包括团队内隐藏实体；基础目录不要求此权限 |
| 人员管理 | `team.entity.profile.manage` | 管理实体资料、团队内可见状态和公开展示状态 |
| 人员管理 | `team.entity.virtual.create` | 创建虚拟实体 |
| 人员管理 | `team.entity.virtual.*.manage` | 管理当前团队全部虚拟实体及集成 |
| 人员管理 | `team.entity.virtual.*.field.manage` | 管理当前团队全部虚拟实体字段 |
| 人员管理 | `team.entity.field.manage` | 管理团队与成员实体字段 |
| 人员管理 | `team.entity.field.customer.manage` | 管理顾客实体字段 |
| 人员委托 | `identity.team.assume` | 领取当前授权团队的团队实体 |
| 人员委托 | `identity.member.*.assume` | 领取当前授权团队的任意有效成员 |
| 人员委托 | `identity.customer.*.assume` | 领取当前授权团队的任意有效顾客 |
| 人员委托 | `identity.virtual.*.assume` | 领取当前授权团队的任意有效虚拟实体 |
| 聊天 | `chat.group.manage` | 管理群聊 |
| 微博 | `weibo.personal.use` | 内部 Entity 使用个人微博业务导航、读取与本地管理 |
| 微博 | `weibo.team.manage` | 使用团队微博业务导航、读取与本地管理；可由目标团队授予外部 Entity |

## 人员权限

`<slug>` 表示人员的标识，使用时需替换为实际值；`*`表示任意人员。

| 模式 | 允许的操作与范围 |
| --- | --- |
| `team.entity.virtual.<slug>.manage` | 管理当前团队指定虚拟实体 |
| `team.entity.virtual.<slug>.field.manage` | 管理当前团队指定虚拟实体字段 |
| `identity.member.<slug>.assume` | 领取当前团队指定有效成员 |
| `identity.customer.<slug>.assume` | 领取当前团队指定有效顾客 |
| `identity.virtual.<slug>.assume` | 领取当前团队指定有效虚拟实体 |
| `team.document.member.<slug>.manage` | 管理当前团队指定成员实体的文档 |
| `team.document.customer.<slug>.manage` | 管理当前团队指定顾客实体的文档 |
| `team.document.virtual.<slug>.manage` | 管理当前团队指定虚拟实体的文档 |
