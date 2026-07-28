# Entity 身份与跨团队委托

LostSky 将认证主体与业务主体分离：`user` 负责登录、设备、根身份和审计，团队业务由当前 `entity` 执行。持有基础 user JWT 不会隐式取得成员、客户或角色权限。

## 领域原则

- `entity.slug` 是实体参与路由、公开标识、引用和动态权限表达的全局唯一键；数据库关系仍使用 `entity.id`。
- entity 不提供自我管理接口，即使当前已经以该 entity 行动，也只能由具备相应 Permission 的 entity 通过管理接口编辑。
- 团队可以把角色和 Permission 授予任意团队的有效 entity；跨团队授权不改变业务操作的目标团队边界。
- Profile、Post 等业务能力优先归属于 entity，不设计为 member 专属能力；只有确属成员关系的语义才进入 `teamMember`。

## 实体与根身份

持久化实体类型为 `team`、`teamMember`、`teamCustomer`、`teamVirtual`，每个实体通过 `entity.slug` 获得全局唯一标识。成员创建时自动领取 `member-{id}` 标识；已有自定义标识保持不变。

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
| `identity.customer.*.assume` | 当前授权团队全部有效客户 |
| `identity.customer.<slug>.assume` | 当前授权团队指定有效客户 |
| `identity.virtual.*.assume` | 当前授权团队全部有效虚拟实体 |
| `identity.virtual.<slug>.assume` | 当前授权团队指定有效虚拟实体 |

精确 slug 保存时必须属于当前授权团队；通配权限不会扩散到其他团队。普通业务权限仍经过 `TeamBelongs`，因此跨团队角色授权只允许来源实体领取目标身份，不允许来源实体直接带着原身份操作目标团队业务。

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
- 根成员或客户仍与真实 user 关联并有效；
- 每一跳的来源、目标实体仍有效；
- 每一跳仍有目标团队授予的精确或通配 assume Permission。

角色绑定、Permission、实体状态或根身份任一失效，整条下游链在下一次请求立即失效。清理任务按子到父顺序永久删除过期记录；仍被子记录引用的父证明会保留。

## 业务上下文

`Context` 只从当前 `acting_entity` 填充业务 `member` 与 `customer`。真实 user 只用于认证、设备、根身份、明确的 user 层流程和审计。`Permission`、`ChatAccess`、成员/客户访问以及交易所有者规则均不得回退到 user 关联关系。

`entity` 是持久化业务主体的唯一根表。业务表只保存一个指向 `entity.id` 的外键；不同职责使用带语义的列名，例如 `handler_entity_id`、`sender_entity_id`、`cs_entity_id`。引用表不再重复保存实体类型，本地 `team_member.id` 等子类型 ID 仅用于子类型自身的结构关系。

## 集中业务审计

Transaction、Shop、File、Document 的写操作统一写入 `business_audit_event`。事件记录当前 `entity_id`、真实 `authenticated_user_id`、团队、应用、动作、资源和请求标识；审计独立存储，业务表不重复保存 actor 类型或认证用户列。`entity_id` 始终指向全局 `entity.id`，slug 不参与审计外键。审计事件默认保留 730 天，可通过 `cleanup.business_audit_retention_days` 调整，并由 `php think system:cleanup` 清理过期记录。
