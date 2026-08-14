---
title: 权限目录
description: 查询 LostSky 当前全部团队 Permission、动态权限和平台管理权限。
---

# 权限目录

本页列出用户界面和错误提示中可能出现的 Permission。团队 Permission 通过团队角色授予 Entity；平台 Permission 通过平台角色授予管理员账号，两套角色完全隔离。为一个角色授予父级 Permission 时，会同时授权其下的所有子项：例如 `team` 或 `team.ability` 都包含 `team.ability.redeem`，但不包含兄弟权限。父键还会自动覆盖未来新增的同前缀权限，属于需要二次确认的“高级范围”；只能从后端目录选择，不能手输未知键。成员仍只通过角色取得权限。

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
| `shop.product.self.manage` | 管理归属当前 Entity 的本人服务、权益包、卡活动、卡密与商品，包括创建、编辑、停用、接单人和核销字段 |
| `shop.product.self.package.reprice` | 调整本人权益包内团队公用服务的单位价格、成本与接单/发单/客服分配；独立授权，不由 `shop.product.self.manage` 自动包含 |
| `shop.order.read` | 查看商家订单 |
| `shop.order.write` | 创建、取消和完成商家订单 |

Shop 团队工作台使用商品与订单的团队级 Permission；Team、成员和虚拟 Entity 还可通过 `shop.product.self.manage` 在个人工作台管理本人商品与完整权益资源链路。本人服务在本人权益包内始终允许调价；团队公用服务只有在额外拥有 `shop.product.self.package.reprice` 时才可改变商业金额，额度和有效期不受该权限限制。Customer 只使用商城客户中心，不能通过这些 Permission 管理商家数据。

## 交易与余额

| Permission | 允许的操作 |
| --- | --- |
| `transaction.read` | 查看 Team 全量流水、余额日志、发单绑定和交易选项；不控制个人工作台的本人相关读取 |
| `transaction.write` | 创建或编辑流水、为客户充值、维护发单绑定，并在团队工作台从 Shop 服务套餐商品手动赋予客户权益 |
| `transaction.delete` | 删除流水 |
| `transaction.report.read` | 查看 Team 全量经营统计；不控制个人工作台的“我的业绩” |
| `service.entitlement.grant` | 使用个人“权益赠送”页中的“赠送权益”动作，为当前 Entity 归属或发单绑定的客户赠送服务权益；不能选择其他发单人。查看本人赠送记录不要求此 Permission |
| `service.redemption.read` | 进入团队“服务核销”并查看全量列表、详情和接单池；不控制个人工作台的“我的核销” |
| `service.redemption.manage` | 同样可进入并查看团队全量核销，并允许改派、处理取消、确认完成和调整费用 |

进入 Transaction 的流水、统计、核销、绑定、余额、充值和权益赠送接口还要求 `transaction` Ability；Ability 缺失时只保留访问快照和不可用说明。个人工作台的相关流水、我的业绩、我的核销、客户协作和本人赠送记录均由服务端限定为当前 Entity，不额外要求 Team 全量读取 Permission。`service.entitlement.grant` 只开放向当前 Entity 客户范围赠送的新动作，不扩大为全团队客户；团队核销读取由 `service.redemption.read` 或 `service.redemption.manage` 开放，管理动作只接受 `service.redemption.manage`。见[能力、权限与功能降级](access-and-abilities.md)。

## 文件、文档与团队设置

| Permission | 允许的操作 |
| --- | --- |
| `file.read` | 查看团队文件和空间用量 |
| `file.upload` | 通过“文件”页上传团队文件库；同时要求当前 File 等级仍有剩余容量。未购买时使用 0 级 128 MiB，资料、商品和 Markdown 等资源附件不要求此键 |
| `file.delete` | 删除团队文件 |
| `team.document.read` | 查看当前团队全部文档；缺少时仍可按文档可见范围读取 |
| `team.setting.read` | 查看团队设置和设置结构 |
| `team.setting.update` | 修改团队设置 |

## 安全与审计

| Permission | 允许的操作 |
| --- | --- |
| `team.audit.read` | 查看当前团队的审计日志列表、安全详情、筛选目录及请求 ID |

新团队 owner 默认具有此权限；现存团队升级后，所有有效 owner 角色会由数据库补丁自动取得。其他角色不会自动获得，需在“角色权限”中由管理员授权。该权限只允许读取当前域名解析出的 Team，不允许通过查询参数切换团队。

文档的创建、编辑和删除不使用统一的 `team.document.write` 键，而是由 Doc Ability、文档管理范围、归属主体和当前 Entity 共同判断。

## 对象字段

| Permission | 允许的操作 |
| --- | --- |
| `team.entity.field.manage` | 管理人员对象字段及相应字段值 |
| `team.entity.field.customer.manage` | 管理客户对象字段及相应字段值 |

虚拟实体字段还可通过对应虚拟实体的 `field.manage` 动态权限控制。字段“可见范围”“值维护范围”和“允许修改字段值”继续限制最终读写。

## 通知

| Permission | 允许的操作 |
| --- | --- |
| `team.notice.read` | 查看 LostSky 发给 Team 的共享“站内通知” |
| `team.notice.send` | 代表 Team 向同团队一个 Entity 发送单向“通知” |

查看当前 Entity 自己的“通知”收件箱不要求额外 Permission。

## 实体委托

| Permission | 能力 |
| --- | --- |
| `identity.team.assume` | 当前授权团队的 Team 实体 |
| `identity.member.*.assume` | 当前授权团队任意有效成员 |
| `identity.customer.*.assume` | 当前授权团队任意有效客户 |
| `identity.virtual.*.assume` | 当前授权团队任意有效虚拟实体 |
| `identity.member.<slug>.assume` | 当前授权团队指定有效成员 |
| `identity.customer.<slug>.assume` | 当前授权团队指定有效客户 |
| `identity.virtual.<slug>.assume` | 当前授权团队指定有效虚拟实体 |

指定成员、客户或虚拟实体的精确 slug 委托统一显示在“实体委托”中；虚拟实体维护权限显示在“实体管理”中，仅限聊天的代操作显示在“聊天”中。角色编辑器只在保存时清理被父键或 `*` 覆盖的精确权限；有效权限页面逐条显示服务端记录。

精确权限中的 `<slug>` 要替换为真实全局 slug，例如 `identity.member.alice.assume`。保存时目标必须属于当前授权团队；`*` 也只覆盖该团队。

## 实体管理

| Permission | 允许的操作 |
| --- | --- |
| `team.entity.virtual.create` | 创建虚拟实体 |
| `team.entity.virtual.*.manage` | 管理当前团队全部虚拟实体及集成 |
| `team.entity.virtual.*.field.manage` | 管理当前团队全部虚拟实体字段 |
| `team.entity.virtual.<slug>.manage` | 管理指定虚拟实体及集成 |
| `team.entity.virtual.<slug>.field.manage` | 管理指定虚拟实体字段 |

Team 界面中的“虚拟实体”入口会识别通配或任一具体 manage 权限。具体操作仍按目标 slug 重新校验。开发期升级补丁会一次性迁移并删除旧权限键，应用不提供旧键别名。

## Chat

| Permission | 允许的操作 |
| --- | --- |
| `chat.conversation.create` | 创建普通单聊或群聊 |
| `chat.group.manage` | 管理群聊参与者 |
| `chat.temporary.create` | 创建临时会话 |
| `chat.message.moderate` | 审核或撤回他人消息 |
| `chat.virtual.*.act` | 代表当前团队全部虚拟实体参与聊天 |
| `chat.virtual.<slug>.act` | 代表指定虚拟实体参与聊天 |

`chat.virtual.*.act` 只影响 Chat 中的会话可见性和受支持操作，不切换当前身份，也不能用于其他应用。开发期升级补丁会迁移并删除 `identity.virtual.*.act`，应用不提供旧键别名。

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
