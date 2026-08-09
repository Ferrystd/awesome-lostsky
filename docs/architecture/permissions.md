# 权限字典

团队权限以 [`PermissionDictionary`](../../app/service/PermissionDictionary.php) 为唯一代码事实源。
角色权限保存为 `team_role_permission.permission_key`，同一实体绑定多个角色时取权限并集。服务端保存所有不同且合法的键，不折叠父子或通配符与指定 slug；官方角色编辑器只在提交权限时生成最小集合，权限摘要则逐条展示存储记录。
`GET /rolePermission/catalog` 向管理端返回同一字典及当前团队的动态虚拟实体项，并通过必返的 `advanced_items` 列出所有可保存父键、当前覆盖的叶子键和范围文案。身份领取归入“实体委托”，虚拟实体维护归入“实体管理”，仅限聊天的代操作归入“聊天”；高级目录由固定权限与当前团队动态权限的所有合法前缀生成并去重。

## 固定权限

| 分组 | Permission | 能力 |
| --- | --- | --- |
| 团队成员 | `team.entity.read` | 查看全部有效实体，包括团队内隐藏实体；基础目录不要求此权限 |
| 团队成员 | `team.entity.profile.manage` | 管理实体资料、团队内可见状态和公开 Display 状态 |
| 团队成员 | `team.member.read` | 查看完整成员管理集合，包括团队内隐藏或封禁成员；基础目录不要求此权限 |
| 团队成员 | `team.member.invite` | 邀请或新增成员 |
| 团队成员 | `team.member.update` | 编辑、封禁、解封、设置 slug 与搜索成员 |
| 团队成员 | `team.member.remove` | 查询、代提、批准和拒绝成员离队申请；不提供直接移出通道 |
| 团队成员 | `team.post_type.write` | 管理岗位类型 |
| 团队成员 | `team.role.read` | 查看角色、权限和角色分配 |
| 团队成员 | `team.role.write` | 管理角色、权限和角色分配 |
| 客户 | `team.customer.read` | 查看当前团队全部客户；无此权限的归属实体仍只能查看自己的客户 |
| 客户 | `team.customer.manage` | 管理客户资料、当前归属与封禁状态，并包含全量客户读取 |
| 加入审核 | `team.join_field.read` | 查看加入申请字段 |
| 加入审核 | `team.join_field.write` | 管理加入申请字段 |
| 加入审核 | `team.join_review.read` | 查看加入申请 |
| 加入审核 | `team.join_review.write` | 审核申请及维护审核任务 |
| 商店 | `shop.product.read` | 查看商品 |
| 商店 | `shop.product.write` | 创建、编辑商品和配置处理人 |
| 商店 | `shop.product.delete` | 删除商品 |
| 商店 | `shop.product.self.manage` | 管理当前 Entity 本人商品 |
| 商店 | `shop.order.read` | 查看订单 |
| 商店 | `shop.order.write` | 创建、取消和完成订单 |
| 交易 | `transaction.read` | 查看流水、余额日志、发单人和交易选项 |
| 交易 | `transaction.write` | 创建或编辑流水、充值及维护发单人绑定 |
| 交易 | `transaction.delete` | 删除流水 |
| 交易 | `transaction.report.read` | 查看交易统计报表 |
| 文件与设置 | `file.read` | 查看团队文件与用量 |
| 文件与设置 | `file.upload` | 通过团队文件库上传团队文件；资源附件上传只受 File Ability 与所属资源编辑鉴权控制 |
| 文件与设置 | `file.delete` | 删除团队文件 |
| 文件与设置 | `team.document.read` | 查看团队全部文档，包括当前 Entity 按可见性无法读取的文档；基础文档入口不要求此权限 |
| 文件与设置 | `team.setting.read` | 查看团队设置及设置结构 |
| 文件与设置 | `team.setting.update` | 修改团队设置 |
| 通知 | `team.notice.read` | 查看 LostSky 发给 Team 的共享站内通知 |
| 通知 | `team.notice.send` | 以团队名义向同 Team Entity 发送单向通知 |
| 实体委托 | `identity.team.assume` | 领取当前授权团队的团队实体 |
| 实体委托 | `identity.member.*.assume` | 领取当前授权团队的任意有效成员 |
| 实体委托 | `identity.customer.*.assume` | 领取当前授权团队的任意有效客户 |
| 实体委托 | `identity.virtual.*.assume` | 领取当前授权团队的任意有效虚拟实体 |
| 实体管理 | `team.entity.read` | 查看当前团队全部实体 |
| 实体管理 | `team.entity.profile.manage` | 管理实体资料与展示状态 |
| 实体管理 | `team.entity.virtual.create` | 创建虚拟实体 |
| 实体管理 | `team.entity.virtual.*.manage` | 管理当前团队全部虚拟实体及集成 |
| 实体管理 | `team.entity.virtual.*.field.manage` | 管理当前团队全部虚拟实体字段 |
| 实体管理 | `team.entity.field.manage` | 管理团队与成员实体字段 |
| 实体管理 | `team.entity.field.customer.manage` | 管理客户实体字段 |
| 聊天 | `chat.conversation.create` | 创建会话 |
| 聊天 | `chat.group.manage` | 管理群聊 |
| 聊天 | `chat.temporary.create` | 创建临时会话 |
| 聊天 | `chat.message.moderate` | 审核或撤回他人消息 |
| 聊天 | `chat.virtual.*.act` | 代表当前授权团队的任意虚拟实体参与聊天 |

## 动态权限

| 模式 | 能力与约束 |
| --- | --- |
| `team.entity.virtual.<slug>.manage` | 管理当前团队指定虚拟实体 |
| `team.entity.virtual.<slug>.field.manage` | 管理当前团队指定虚拟实体字段 |
| `chat.virtual.<slug>.act` | 代表当前团队指定虚拟实体参与聊天；不切换当前身份，也不授权其他应用 |
| `identity.member.<slug>.assume` | 领取当前团队指定有效成员 |
| `identity.customer.<slug>.assume` | 领取当前团队指定有效客户 |
| `identity.virtual.<slug>.assume` | 领取当前团队指定有效虚拟实体 |

动态权限保存时会校验目标实体属于当前授权团队。`*` 权限只覆盖当前团队，不扩散到其他团队；Permission 不支持 deny，多个候选权限按 OR 判断。父键自动覆盖其下所有子键，例如 `team` 和 `team.ability` 都可满足 `team.ability.redeem`，但不会覆盖兄弟键；保存后的父键不展开，并会自动包含未来新增的同前缀子权限。父键仍须是权限目录中已有键的前缀，动态键父级继续校验对应实体属于当前团队，未知前缀与跨团队精确目标均拒绝保存。

服务端兼容父键与子键、`*` 与指定 slug 同时存储，不在写入或读取时清理这些覆盖冗余。官方前端在用户保存角色权限时统一移除已被更宽权限覆盖的键；仅查看角色或有效权限不会触发清理。

开发期升级补丁会把旧虚拟实体、字段和 `identity.virtual.*.act` 键迁移到当前命名并删除旧键。新的 `chat` 父权限只覆盖聊天能力；`identity.virtual.*.act` 不作为运行时别名。

`team.entity.read`、`team.member.read`、`team.document.read` 和 `team.customer.read` 表示“全量读取”，不是基础入口许可。没有客户全量读取权限时，当前归属实体仍可查看自己的客户；Customer 在通用实体目录中始终需要 `team.entity.read`，对无权 Customer 与团队内隐藏实体的直接访问返回 404；文档继续按自身可见性返回。`team.customer.manage` 同时授予客户全量读取，并控制资料、归属与封禁更新；客户本人在 Shop 只可修改自己的资料和归属，不因此获得后台管理权限。

权限拒绝使用结构化错误：`data.kind=permission` 且 `data.required_any` 列出任一可满足的 Permission；能力拒绝使用 `data.kind=ability` 并返回能力键、标签、最低等级和缺失原因。前端由 `@lostsky/api/error-format` 读取结构化数据，并通过 `@lostsky/api/error-messages` 的默认模板或按键覆盖生成提示；单一 Permission 和 Ability 可按原始键覆盖，多个候选 Permission 始终使用默认模板并以 ` / ` 连接。结构化数据不完整时保留服务端原始文案。

`team.member.remove` 允许管理员直接办理成员离职，不创建待审申请；成员自助离队不依赖该 Permission，但只允许正常成员本人使用直接领取的根身份会话。自助申请仍受 `member.departure_mode` 控制并可进入审核；复职继续复用 `team.join_review.read/write`，不新增独立复职 Permission。非正常成员 Entity 是否具备业务可用性由 `member.inactive_entity_available` 动态决定，assume Permission 只决定谁可以代入，不覆盖 Entity 可用性。

## 平台权限

Admin 平台权限与团队权限共用 `PermissionDictionary` 作为代码事实源，但分别由 `adminGroups()`、`adminKeys()` 暴露，绝不进入团队角色目录。平台角色保存于 `platform_admin_role`，角色权限保存于 `platform_admin_role_permission`，用户与多个角色的绑定保存于 `platform_admin_user_role`；有效权限取角色并集。

| 分组 | Permission | 能力 |
| --- | --- | --- |
| 平台概览 | `admin.dashboard.read` | 查看平台总览 |
| 平台概览 | `admin.system.read` | 查看系统状态 |
| 平台权益 | `admin.entitlement.read` | 查看 Ability 权益与体验码 |
| 平台权益 | `admin.entitlement.write` | 管理 Ability 权益与体验码 |
| 用户治理 | `admin.user.read` | 查看用户与脱敏联系方式 |
| 用户治理 | `admin.user.sensitive.read` | 查看用户完整手机和邮箱 |
| 用户治理 | `admin.user.moderate` | 封禁与解封用户 |
| 用户治理 | `admin.user.session.revoke` | 撤销用户全部会话 |
| 团队治理 | `admin.team.read` | 查看团队 |
| 团队治理 | `admin.team.moderate` | 封禁与解封团队 |
| 平台权限 | `admin.access.read` | 查看平台管理员与角色 |
| 平台权限 | `admin.access.write` | 管理平台管理员与角色 |
| 平台权限 | `admin.audit.read` | 查看集中审计事件 |

`super_admin` 系统角色始终拥有 `adminKeys()` 的全部权限；自定义角色按存储的权限键计算并集。平台权限不支持 deny，也不能通过团队角色获得。

## 维护规则

- 新增受保护能力时，先在 `PermissionDictionary` 增加常量、分组和文案，再由业务代码引用常量。
- 固定 key 或动态 key 族未进入字典时，运行时配置与角色权限保存都会拒绝。
- 只为已有业务入口增加权限；尚未实现的客户删除/导出、文件分享和交易分类不预留空 key。
- 同步更新受影响的 OpenAPI、测试、本页和 Changelog。
