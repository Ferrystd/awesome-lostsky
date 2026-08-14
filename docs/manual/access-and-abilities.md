---
title: 能力、权限与功能降级
description: 了解 Ability、Permission、能力等级、完整能力枚举，以及缺失或过期时哪些功能仍可使用。
---

# 能力、权限与功能降级

LostSky 的访问结果不是由单一“管理员”开关决定。系统会依次确认登录和当前身份、团队归属、Ability、Permission、内容可见范围及业务状态。

## Ability 与 Permission 的区别

| 项目 | Ability | Permission |
| --- | --- | --- |
| 归属 | 团队 | 当前 Entity 的角色 |
| 作用 | 决定某项产品能力是否开通、等级和有效期 | 决定具体读取、创建、编辑、删除或管理动作 |
| 例子 | `transaction` 开通记账能力 | `transaction.write` 允许登记或编辑流水 |
| 谁能调整 | 当前版本由 LostSky 平台运维授予；Team 和 Admin 界面只读或不提供授权 | 具备 `team.role.write` 的团队角色管理员 |
| 缺失提示 | `当前团队缺失能力(Ability): …` | `缺少权限(Permission): …` |

某操作同时要求两者时，二者必须同时满足。拥有全部 Permission 不会自动开通 Ability；团队开通 Ability 也不会把对应权限自动发给所有实体。

## Ability 有效条件

一项 Ability 同时满足以下条件才可用：

- 团队存在该能力记录；
- 能力等级不低于功能要求的最低等级；
- 有效期为永久，或尚未到期；
- 对 `file` 而言，上传后还不能超过对应档位的团队总容量；文件数量不限制。

能力状态的缺失原因包括：

| 原因 | 含义 | 恢复方向 |
| --- | --- | --- |
| `missing` | 团队没有该能力记录 | 联系 LostSky 平台管理员开通 |
| `level` | 已有能力等级低于功能要求 | 联系平台管理员调整等级 |
| `expired` | 能力已经到期 | 联系平台管理员续期 |

用户界面通常显示统一的能力缺失文案；在向管理员反馈时，应同时提供能力键、团队 slug 和页面提示。

## 当前 Ability 完整枚举

| Ability 键 | 界面名称 | 最低可用等级 | 控制范围 |
| --- | --- | ---: | --- |
| `doc` | 文档 | 1 | Team 文档列表、详情、创建、编辑和删除 |
| `file` | 文件上传 | 1 | 文件页、Markdown 编辑器、成员资料和加入申请等团队文件上传 |
| `transaction` | 记账 | 1 | 流水写入与删除、经营统计、客户充值、手动赋予客户权益，以及商城自动生成关联流水 |
| `shop` | 商城 | 1 | 控制团队能否通过“开放商城”向客户展示和销售已上架商品 |

当前没有 Chat 或 Display 独立 Ability。Shop 后台、客户中心与历史业务不受 Shop Ability 限制；该 Ability 只控制公开商品陈列与客户购买。

### File Ability 等级与配额

单个文件最大 50 MiB。团队总配额按 File Ability 等级计算：

| 等级 | 团队总容量 |
| ---: | ---: |
| 0 / 未购买 | 128 MiB |
| 1 | 500 MiB |
| 2 | 2 GiB |
| 3 | 不限制 |

文件数量不参与配额判断。团队即使没有 File Ability 记录，也自动按 0 级获得 128 MiB；付费等级到期后同样回落到 0 级，不会变成完全无法上传。“不限制”只表示不使用团队总容量上限，单文件大小、允许扩展名、安全校验和 Permission 仍然有效。容量用尽时，全部本地上传入口会禁用并提示“该团队文件已达到上限，请联系团队管理员。”删除已有文件或升级 File Ability 后即可继续上传。

`doc` 和 `transaction` 当前只要求等级 1，没有按更高等级开放额外用户功能。能力模型保留等级，是为了让需要分级的能力（例如文件配额）能够共用同一套规则。

## 缺失 Ability 时怎样降级

| 缺失或不可用能力 | 停止的功能 | 仍可使用的功能 |
| --- | --- | --- |
| `doc` | Team 文档导航禁用；文档列表、详情、创建、编辑和删除不能进入 | 文件、实体资料、通知等其他 Team 功能；已经公开的文档不会因能力失效而自动撤下 Display |
| `transaction` | Transaction 个人/团队工作台中的流水、统计、核销、绑定、余额与充值业务请求；商城订单自动生成关联流水 | 记账访问快照与不可用说明；Team、Shop、Chat 其他功能；客户继续用既有预存余额下单、取消和退款，订单与余额结果不受影响 |
| `shop` | 公开商城首页与列表不再展示商品，商品详情和新购买被拒绝，“开放商城”自动关闭 | 商城后台、客户中心、历史订单、余额、卡密和已有服务权益 |

更具体的行为：

- `doc` 不依赖 File 等级。没有购买 File 升级时仍可写 Markdown、保存文档，并在 0 级容量内上传或使用外部图片地址。
- `file` 不依赖 `doc`。没有 Doc Ability 时仍可在 File 0 级或更高等级容量内管理上传内容。
- Transaction Ability 缺失时，记账入口保持可见但禁用；直接地址只读取访问快照，不读取历史流水、余额或绑定，也不处理服务核销。
- 商城设置“自动同步记账流水”只有在设置开启且 `transaction` Ability 有效时生效。条件不满足时，订单照常创建并扣减余额，只是不生成关联流水。
- “手动赋予权益时同步流水”是独立 TeamSetting；手动赋予本身位于 Transaction 并要求 Transaction Ability，关闭设置时只生成权益且始终不创建 Shop 订单。
- Ability 到期不会自动删除历史数据，也不会回滚已经完成的订单、流水、文件或公开内容。
- 有限期 Ability 发生真实等级下降或完全失效时，团队共享收件箱会收到一条站内通知；同等级授权仍覆盖时不通知。

## Permission 如何计算

Permission 来自当前 Entity 在目标团队中获得的全部角色，多个角色取并集。Permission 没有 deny 规则；任一角色包含所需键即可通过该项检查。

有些接口接受多个候选 Permission，满足任意一个即可。有些权限带 `*` 或具体 slug：

- `identity.member.*.assume`：可领取当前授权团队任意有效成员；
- `identity.member.alice.assume`：只可领取当前团队的 `@alice`；
- `chat.virtual.*.act`：可代表当前团队全部虚拟实体参与聊天；
- `chat.virtual.support-bot.act`：只可在 Chat 中代表 `@support-bot`。

通配权限只覆盖授予它的团队，不会扩散到其他团队。所有固定键和动态模式见[权限目录](permissions.md)。

## 全量读取不是页面门票

以下 Permission 表示扩大可读范围，不代表没有它就完全无法进入：

| Permission | 缺少时的基础范围 | 具备后的范围 |
| --- | --- | --- |
| `team.entity.read` | 有效、非 Customer 且团队内可见的实体 | 全部有效实体，包括 Customer 和团队内隐藏实体 |
| `team.member.read` | 有效且团队内可见的成员 | 完整成员管理集合，包括隐藏或封禁成员 |
| `team.document.read` | 当前 Entity 按文档可见性可读的文档 | 当前团队全部文档 |
| `team.customer.read` | 当前归属实体只看到归属于自己的客户 | 当前团队全部客户 |

无权访问隐藏对象时，直接链接会返回“未找到”，而不是确认对象存在后再报无权。

页面标题区的主操作不会因为暂时缺少 Permission 而变成另一种灰色按钮或移动位置：入口仍保留同一图标、文字和主色来源，以灰绿色降权表示不可用；存在具体原因时，触发该入口会显示需要补齐的 Permission、Ability 或业务条件。

## 推荐的授权顺序

1. 先确认用户已经领取正确团队的实体身份。
2. 确认团队已开通任务所需 Ability。
3. 创建职责清楚的角色，并保存完整 Permission 集合。
4. 把角色分配给需要执行任务的实体。
5. 用该实体重新进入任务页，验证读、写和失败恢复路径。

以下只是角色设计示例，不是系统自动创建的内置角色：

| 角色示例 | 常见 Permission |
| --- | --- |
| 内容维护 | `team.entity.profile.manage`、`team.document.read`、`file.read`；如需直接维护团队文件库，再授予 `file.upload` |
| 成员管理员 | `team.member.read`、`team.member.invite`、`team.member.update`、`team.member.remove` |
| 财务 | `transaction.read`、`transaction.write`、`transaction.report.read` |
| 客户运营 | `team.customer.read`、`team.customer.manage`、`team.notice.send` |
| 发单运营 | `service.entitlement.grant`；本人相关流水、业绩和客户协作无需 Team 全量读取 Permission |
| Chat 运营 | `chat.conversation.create`、`chat.group.manage`，以及所需虚拟实体的 `chat.virtual.<slug>.act` 权限 |

新团队会自动创建 owner 角色并给创建者取得管理所需权限。后续修改 owner 或其他高权限角色前，应先确保至少还有一个实体能够恢复角色配置。

## 访问失败时先判断哪一层

| 现象 | 更可能的原因 | 下一步 |
| --- | --- | --- |
| 被送到登录页 | 未登录、登录过期或设备会话被撤销 | 重新登录并返回原任务 |
| 被要求领取成员身份 | 当前没有实体身份 | 在 Account 确认目标团队并领取身份 |
| 提示身份属于其他团队 | 当前 Entity 与地址团队不一致 | 确认切换；取消会保留原身份 |
| 提示 `Permission` | 当前 Entity 的角色缺少具体授权键 | 联系团队角色管理员 |
| 提示 `Ability` | 团队未开通、等级不足或已过期 | 联系 LostSky 平台管理员 |
| 显示“未找到” | 对象无效、跨团队、被隐藏或链接错误 | 核对团队、slug/编号和对象状态 |
| 提示余额、配额或状态不允许 | 业务前置条件不满足 | 按页面提示充值、清理空间或等待状态变化 |

完整恢复步骤见[问题排查](troubleshooting.md)。
