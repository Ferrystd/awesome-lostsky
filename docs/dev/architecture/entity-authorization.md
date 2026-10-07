# Entity 身份与跨团队委托

LostSky 将认证主体与业务主体分离：`user` 负责登录、设备、根身份和审计，团队业务由当前 `entity` 执行。持有基础 user JWT 不会隐式取得成员、顾客或角色权限。

## 领域原则

- `entity.slug` 是实体参与路由、公开标识、引用和动态权限表达的全局唯一键；数据库关系仍使用 `entity.id`。
- 当前 JWT 的 Team、成员或虚拟叶子 Entity 可以在 Team 个人工作台自我管理有限资料，以及 `manager_scope=SubjectTeam` 的对象字段；字段管理员始终可以修改字段值。Customer 使用对应 Shop 顾客中心。该资格只来自“当前正在使用此 Entity”，不来自真实账号、根身份或父级委托链。角色、状态、内部可见性、全局搜索、Display、公开文档分组、Webhook 和集成仍只能通过原管理 Permission 修改。
- 团队可以把角色和 Permission 授予任意团队的有效 entity；跨团队授权不改变业务操作的目标团队边界。
- Profile、Post 等业务能力优先归属于 entity，不设计为 member 专属能力；只有确属成员关系的语义才进入 `teamMember`。

## 实体与根身份

持久化实体类型为 `team`、`teamMember`、`teamCustomer`、`teamVirtual`，每个实体通过 `entity.slug` 获得全局唯一标识。成员创建时自动领取 `member-{id}` 标识；已有自定义标识保持不变。

实体有三套独立的发现范围：

- `entity.is_internal_visible`：只控制普通当前 Team Entity 能否在团队工作空间目录发现对象；`team.entity.read` 可越过该限制，Team 实体恒可见。
- `entity.search_override` 与底层对象的 `is_searchable`：只控制全局实体搜索。
- `entity.is_displayed`：只控制互联网访客能否在公开 Display 浏览该实体。

这三者不互相继承。无 `team.entity.read` 的请求访问团队内隐藏实体时返回 404，避免通过深链接确认对象存在。

基础 user JWT 只能直接领取：

- `user_id` 指向当前用户的有效 `teamMember`；
- `user_id` 指向当前用户的有效 `teamCustomer`。

`/identity/member` 是显式的根身份重置：它按真实 user 与 `team_slug` 重新领取本人成员，而不是执行一次 entity 委托。`/identity/drop` 撤销当前实体会话并回到基础 user JWT。

## 目标团队授权

`team_entity_role.team_id` 是授权生效的目标团队，`team_entity_role.entity_id` 直接引用全局 `entity.id`，可以指向任意团队的有效实体。团队通过准确的全局 slug 查询和分配来源实体，不依赖该实体是否公开可搜索；slug 只参与查找和权限表达，不作为业务外键。

委托权限由目标团队角色持有：

| Permission | 目标 |
| --- | --- |
| `identity.team.assume` | 当前授权团队的 team 实体 |
| `identity.member.*.assume` | 当前授权团队全部有效成员 |
| `identity.member.<slug>.assume` | 当前授权团队指定有效成员 |
| `identity.customer.*.assume` | 当前授权团队全部有效顾客 |
| `identity.customer.<slug>.assume` | 当前授权团队指定有效顾客 |
| `identity.virtual.*.assume` | 当前授权团队全部有效虚拟实体 |
| `identity.virtual.<slug>.assume` | 当前授权团队指定有效虚拟实体 |

精确 slug 保存时必须属于当前授权团队；通配权限不会扩散到其他团队。Team、Shop、Transaction 与 Weibo 的团队范围使用 `TeamWorkspaceAuth`：来源实体只要全局有效且获得目标团队至少一个角色，就可保持原身份进入基础概览，再按该目标团队角色计算业务 Permission。个人工作台、自助接口和成员本人接口使用 `TeamAuth`，必须切换到归属于地址团队的内部 Entity。Chat 是 teamless 应用，只要求有效当前 Entity，再按会话参与关系授权；Team 内的群聊管理按群所属团队的 `chat.group.manage` 授权。

外部 Entity 进入团队工作台时，访问快照返回 `belongs_to_team=false`、`is_external=true` 和警告状态。Account 的确认 Cookie 只按当前 Entity 与目标团队组合抑制短期提示；角色撤销后即使 Cookie 尚在，`TeamWorkspaceAuth` 和每次业务 Permission 校验仍立即拒绝。业务资源的 owner、账号绑定对象和顾客仍必须属于目标团队。订单和流水的接单人、发单人、客服允许引用任意团队存在且有效的 Entity，商品已配置的接单池资格仍须满足；人员合作记账不扩大业务资源范围，也不授予访问权限。

例如团队 B 把含 `identity.member.bob.assume` 的角色授予团队 A 的 `bot-a`，`bot-a` 可以领取团队 B 的 `@bob`。领取后业务 actor 是 Bob 的成员实体，而真实 user 与设备审计保持不变。

## 父子会话证明链

每次 entity 委托都会：

1. 将当前 `entity_session` 标记为 `superseded_at`；
2. 插入以当前会话为 `parent_session_id` 的子会话；
3. 继承根会话的 `expires_at`，不延长登录期限；
4. 使旧 JWT 立即不可再作为当前会话使用。

父 ID 必须小于子 ID，因此会话记录天然无环。业务实体可以重复并形成 `A → B → A`；不设置委托深度、来源团队或目标类型限制。

每个携带 entity JWT 的请求都从叶会话迭代到根会话，并重新验证：

- 所有节点属于同一 user 与设备，未被安全撤销且仍在根到期时间内；
- 根成员或顾客仍与真实 user 关联并有效；
- 每一跳的来源、目标实体仍有效；
- 每一跳仍有目标团队授予的精确或通配 assume Permission。

角色绑定、Permission、实体状态或根身份任一失效，整条下游链在下一次请求立即失效。清理任务按子到父顺序永久删除过期记录；仍被子记录引用的父证明会保留。

Team 个人工作台和 Shop 顾客中心的自管接口只解析上述证明链的最终叶节点。即使链路出现 `成员 A → 虚拟实体 B → 成员 A`，读取与写入目标也只是最终 JWT 中的成员 A；B 和更早的 A 会话都不产生隐式编辑权。Team 个人写请求还必须携带 `expected_entity_id`，服务端在写入前与当前叶子 `entity.id` 比较，不一致时返回 `409`，避免旧页面在切换身份后误改新实体。Account 只解析旧深链的安全目标，不再返回或修改实体资料。

## 业务上下文

Community 同样使用当前全局 Entity，社区 slug 不确定人员身份。公开读取允许无 Entity；社区管理员关系只授予该社区日常管理权，Team 的社区管理按所有者团队 Permission 校验。Admin 平台社区管理使用平台 user 权限，不要求领取 Entity；三种入口的权限互不隐式转换，详见 [Community](../apps/community.md)。

`Context` 只从当前 `acting_entity` 填充业务 `member` 与 `customer`。真实 user 只用于认证、设备、根身份、明确的 user 层流程和审计。`Permission`、`ChatAccess`、成员/顾客访问以及交易所有者规则均不得回退到 user 关联关系。

`entity` 是持久化业务主体的唯一根表。业务表只保存一个指向 `entity.id` 的外键；不同职责使用带语义的列名，例如 `handler_entity_id`、`sender_entity_id`、`cs_entity_id`。引用表不再重复保存实体类型，本地 `team_member.id` 等子类型 ID 仅用于子类型自身的结构关系。

`team_customer.assignee_entity_id` 表示顾客可变的当前归属，只允许引用同 Team 的 Team、成员或虚拟实体。公开页面的 `ref=<entity-slug>` 只在首次创建顾客时登记初始值；顾客本人和具备 `team.customer.manage` 的后台实体可修改。订单与流水在创建时把当前归属快照到 `team_transaction.sender_entity_id`，后续改归属不追溯历史记录。

## 集中业务审计

Transaction、Shop、File、Document 的写操作统一写入 `business_audit_event`。普通业务事件记录当前 `entity_id`、真实 `authenticated_user_id`、团队、应用、动作、资源和请求标识；审计独立存储，业务表不重复保存 actor 类型或认证用户列。`entity_id` 始终指向全局 `entity.id`，slug 不参与审计外键。

Admin 平台治理与 CLI 自举也写入同一张表。平台事件不依赖团队和业务实体，因此 `team_id`、`entity_id` 可以为空；CLI 没有认证用户时 `authenticated_user_id` 也可以为空。平台事件在 `context.source` 标明 `api` 或 `cli`，治理事件同时记录操作原因和状态变化。审计事件默认保留 730 天，可通过 `cleanup.business_audit_retention_days` 调整，并由 `php think system:cleanup` 清理过期记录。
