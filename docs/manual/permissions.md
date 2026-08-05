---
title: 权限目录
description: 查询 LostSky 当前全部团队 Permission、动态权限和平台管理权限。
---

# 权限目录

本页列出用户界面和错误提示中可能出现的 Permission。团队 Permission 通过团队角色授予 Entity；平台 Permission 通过平台角色授予管理员账号，两套角色完全隔离。为一个角色授予父级 Permission 时，会同时授权其下的所有子项：例如 `team` 或 `team.ability` 都包含 `team.ability.redeem`。

## 团队成员与实体

| Permission | 允许的操作 |
| --- | --- |
| `team.entity.read` | 查看全部有效实体，包括 Customer 和团队内隐藏实体；基础实体目录不要求此权限 |
| `team.entity.profile.manage` | 管理实体资料、团队内可见状态和公开 Display 状态 |
| `team.member.read` | 查看完整成员管理集合，包括团队内隐藏或封禁成员；基础成员目录不要求此权限 |
| `team.member.invite` | 邀请或新增成员 |
| `team.member.update` | 编辑、封禁、解封、设置 slug 与搜索状态 |
| `team.member.remove` | 从团队移出成员 |
| `team.role.read` | 查看角色、Permission 和角色分配 |
| `team.role.write` | 创建、编辑或删除角色，保存 Permission 和实体角色分配 |

## 客户

| Permission | 允许的操作 |
| --- | --- |
| `team.customer.read` | 查看当前团队全部客户；缺少时，归属实体仍可看自己的客户 |
| `team.customer.manage` | 管理客户资料、当前归属和封禁状态，同时包含全量客户读取 |

## 加入申请

| Permission | 允许的操作 |
| --- | --- |
| `team.join_field.read` | 查看加入申请字段 |
| `team.join_field.write` | 创建、编辑和删除加入申请字段 |
| `team.join_review.read` | 查看加入申请和详情 |
| `team.join_review.write` | 开始审核、维护审核任务、同意或拒绝申请 |

## 商城商品与订单

| Permission | 允许的操作 |
| --- | --- |
| `shop.product.read` | 查看商家内部商品资料 |
| `shop.product.write` | 创建、编辑商品和配置处理实体 |
| `shop.product.delete` | 删除商品 |
| `shop.order.read` | 查看商家订单 |
| `shop.order.write` | 创建、取消和完成商家订单 |

当前 Shop 前台只向访客和客户提供浏览、购买及“我的订单”；商家商品和订单管理尚未提供完整用户界面。上述 Permission 已用于既有业务接口，不表示普通客户可以管理商家数据。

## 交易与余额

| Permission | 允许的操作 |
| --- | --- |
| `transaction.read` | 查看流水、余额日志、发单绑定和交易选项 |
| `transaction.write` | 创建或编辑流水、为客户充值、维护发单绑定 |
| `transaction.delete` | 删除流水 |
| `transaction.report.read` | 查看经营统计 |

写入、删除、统计和充值中的部分动作还要求 `transaction` Ability，见[能力、权限与功能降级](access-and-abilities.md)。

## 文件、文档与团队设置

| Permission | 允许的操作 |
| --- | --- |
| `file.read` | 查看团队文件和空间用量 |
| `file.upload` | 上传团队文件；同时要求 File Ability 和配额可用 |
| `file.delete` | 删除团队文件 |
| `team.document.read` | 查看当前团队全部文档；缺少时仍可按文档可见范围读取 |
| `team.setting.read` | 查看团队设置和设置结构 |
| `team.setting.update` | 修改团队设置 |

文档的创建、编辑和删除不使用统一的 `team.document.write` 键，而是由 Doc Ability、文档管理范围、归属主体和当前 Entity 共同判断。

## 对象字段

| Permission | 允许的操作 |
| --- | --- |
| `team.entity_field.manage` | 管理人员对象字段及相应字段值 |
| `team.entity_field.customer.manage` | 管理客户对象字段及相应字段值 |

虚拟实体字段还可通过对应虚拟实体的 `field.manage` 动态权限控制。字段“可见范围”“值维护范围”和“允许修改字段值”继续限制最终读写。

## 通知

| Permission | 允许的操作 |
| --- | --- |
| `team.notice.read` | 查看 LostSky 发给 Team 的共享“站内通知” |
| `team.notice.send` | 代表 Team 向同团队一个 Entity 发送单向“通知” |

查看当前 Entity 自己的“通知”收件箱不要求额外 Permission。

## 身份委托

| Permission | 允许领取的目标 |
| --- | --- |
| `identity.team.assume` | 当前授权团队的 Team 实体 |
| `identity.member.*.assume` | 当前授权团队任意有效成员 |
| `identity.customer.*.assume` | 当前授权团队任意有效客户 |
| `identity.virtual.*.assume` | 当前授权团队任意有效虚拟实体 |
| `identity.member.<slug>.assume` | 当前授权团队指定有效成员 |
| `identity.customer.<slug>.assume` | 当前授权团队指定有效客户 |
| `identity.virtual.<slug>.assume` | 当前授权团队指定有效虚拟实体 |

精确权限中的 `<slug>` 要替换为真实全局 slug，例如 `identity.member.alice.assume`。保存时目标必须属于当前授权团队；`*` 也只覆盖该团队。

## Chat

| Permission | 允许的操作 |
| --- | --- |
| `chat.conversation.create` | 创建普通单聊或群聊 |
| `chat.group.manage` | 管理群聊参与者 |
| `chat.temporary.create` | 创建临时会话 |
| `chat.message.moderate` | 审核或撤回他人消息 |
| `chat.virtual.create` | 创建虚拟实体 |
| `chat.virtual.*.manage` | 管理当前团队全部虚拟实体及集成 |
| `chat.virtual.*.operate` | 代表当前团队全部虚拟实体参与 Chat |
| `chat.virtual.*.field.manage` | 管理当前团队全部虚拟实体字段 |
| `chat.virtual.<slug>.manage` | 管理指定虚拟实体及集成 |
| `chat.virtual.<slug>.operate` | 代表指定虚拟实体参与 Chat |
| `chat.virtual.<slug>.field.manage` | 管理指定虚拟实体字段 |

Team 界面中的“虚拟实体”入口会识别通配或任一具体 manage 权限。具体操作仍按目标 slug 重新校验。

## 平台管理权限

| Permission | 允许的操作 |
| --- | --- |
| `admin.dashboard.read` | 查看平台总览 |
| `admin.system.read` | 查看脱敏系统状态 |
| `admin.entitlement.read` | 查看平台 Ability 权益包、体验活动与脱敏兑换码 |
| `admin.entitlement.write` | 管理平台 Ability 权益包、体验活动及兑换码 |
| `admin.user.read` | 查看用户和脱敏联系方式 |
| `admin.user.sensitive.read` | 使用完整手机或邮箱搜索并查看完整联系方式 |
| `admin.user.moderate` | 封禁或解封用户 |
| `admin.user.session.revoke` | 撤销用户全部设备与登录会话 |
| `admin.team.read` | 查看团队、域名和 Ability |
| `admin.team.moderate` | 封禁或解封团队 |
| `admin.access.read` | 查看平台管理员和平台角色 |
| `admin.access.write` | 管理平台管理员、角色与权限 |
| `admin.audit.read` | 查看集中审计事件 |

`super_admin` 是系统角色，始终拥有全部平台 Permission。平台角色不能授予团队业务权限，团队角色也不能进入 Admin。

## 权限错误怎样处理

权限拒绝会显示一个或多个可满足的 Permission，例如：

```text
缺少权限(Permission): file.upload
```

当提示多个键时，通常满足其中任意一个即可。把完整提示、当前 Entity 的 slug、团队 slug 和操作页面发给团队角色管理员；不要发送密码、验证码、Token 或 Cookie。
