# Team 应用

界面专属约束见[后台设计规范：Team](../design/admin/applications.md#team)；公共组件、状态和响应式规则不在本页重复。

Team 是团队工作台的核心应用，负责成员资料、角色权限、团队配置、文件、文档、通知和加入审核。除加入申请的访客入口外，业务接口都以当前团队上下文为边界。

## 业务领域

- 当前实体入口：Team 导航和旧 `/me` 跳转 Account 当前实体中心；成员在创建或加入时仍取得稳定的全局实体标识。
- 成员管理：正常、封禁、离队三态，成员资料、任期留存、封禁、离队申请、复职和搜索。
- 扩展资料：成员自定义字段、字段值和岗位类型。
- RBAC：角色、角色权限和成员角色绑定。
- 团队设置：按应用读取配置，由团队管理者读取配置结构并保存设置。
- Chat 管理配置：维护统一实体字段、虚拟实体与 Webhook 集成；管理接口记录在 Team OpenAPI。
- 内容协作：保留 LostSky 向 Team 发送的共享站内通知；同时允许有权限的当前 Entity 代表 Team 向本团队任意 Entity（包括 Team 自身）发送通知。两种通道相互隔离，每条通知的已读状态由其收件 Team 或 Entity 共享。团队文件和任意团队实体的文档通过 `entity_id` 关联全局 `entity`。
- 加入团队：申请表单、可选的全局邀请来源、申请记录、审核任务和审批；仅在链接带有邀请参数时显示只读邀请人，审批通过后把有效申请邀请人写入成员关系。
- 实体引用：为 Markdown 等场景搜索和解析可引用对象。
- 访问快照与概览：向四类 Team Entity 返回有效 Permission、Ability 状态，以及互不连带失败的实体、成员、文档、通知指标。

具体接口路径和数据结构见 [`team.openapi.json`](../openapi/team.openapi.json)。

## 鉴权边界

Team 应用按操作组合以下中间件：

- `JwtAuth`：确认登录用户。
- `Context`：保留真实 `user_id` 用于认证和审计，只从当前 `acting_entity` 填充业务 `member`、`customer` 与实体上下文。
- `EntityRequired`：要求请求已携带有效实体会话；缺少实体时返回 HTTP 428、`code=42801` 和当前 `team_slug`。
- `TeamAuth`：组合 `EntityRequired` 与 `TeamBelongs`，先要求实体，再校验实体归属。
- `EntityType`：按接口声明允许的基础用户或实体身份类型；同一声明中的多个类型按 OR 处理。
- `TeamBelongs`：确认显式实体属于当前域名解析出的团队，不重复处理状态或角色权限。
- `MemberAccess`：确认当前 actor 就是该团队的有效成员实体。
- `Permission`：按当前实体绑定角色的权限目录校验具体业务操作。
- `TeamGuest`：限制加入申请入口只能由非成员使用。
- `Ability:doc`：确认团队已开通文档能力；文档归属、管理范围和可见性由服务层控制。

控制器仅提取参数、调用服务并返回统一响应；权限判断和跨模型事务由中间件与服务层完成。

团队业务要求 `team`、`teamMember`、`teamCustomer`、`teamVirtual` 四种实体 JWT，不再从基础 JWT 静默领取成员，也不通过响应头换发令牌。
缺少实体由前端进入 Account 成员回调；实体不属于当前团队时返回 HTTP 403、`code=40301` 和当前 `team_slug`。
允许跨团队实体的少数接口只声明 `EntityRequired`，要求当前团队归属的接口使用 `TeamAuth`。旧当前成员资料与成员上传兼容接口仍只接受
`teamMember`；加入申请人的动作只接受基础用户 JWT，且不经过 `TeamAuth`。

`GET /me/get`、`POST /me/edit|slug|fields` 作为兼容 API 保留，前端不再维护独立表单。新的 Account 当前实体接口覆盖成员、客户和虚拟实体；旧入口仍不接受目标对象标识，只使用当前成员上下文，并且只允许写入本人可见且可编辑的人员实体字段。

`GET /access` 是当前 Entity 的通用访问快照，不依赖成员专属 `/me/get`。`GET /dashboard` 独立计算实体、成员、文档和通知：实体、成员与文档只有在具备相应全量读取 Permission 时返回计数，否则返回 `count=null`；Doc Ability 缺失时只把文档指标标记为不可用；任一指标异常不会把其余指标变成 `0`。

`GET /entity/index|get` 与 `GET /member/index|get` 不把 `team.entity.read` 或 `team.member.read` 作为页面门票。缺少实体全量读取权限时只返回有效、非 Customer 且团队内可见的实体；Customer 与隐藏实体统一返回 404。具有权限时读取完整集合。`team.entity.profile.manage` 控制资料、内部可见和公开 Display 写入，读取基础详情本身不要求该权限。

`GET /member/get` 在成员资料之外返回当前操作者对该任务页的能力集合，包括成员编辑、字段管理、角色读取/编辑、封禁、搜索设置、slug 补全、办理离职和身份切换。前端据此裁剪整张卡片和操作入口；所有写接口仍各自执行服务端权限校验。

成员生命周期不再使用软删除：`team_member.status` 保存正常、封禁和已离队状态，`is_blocked` 仅保留为弃用兼容字段。离队通过 `/memberDeparture/index|get|mine|apply|depart|cancel|approve|reject` 完成；`depart` 仅供有 `team.member.remove` 的管理员一次办结离职，其他申请类接口保留成员自助流程。任期写入 `team_member_tenure`，第一版只后端留存。复职是 `team_join_application.purpose=reinstate`，服务端按成员状态推断目的，批准时复用原 Member 与 Entity。

## 角色与权限

角色读取与维护分别要求 `team.role.read`、`team.role.write`；新团队自动创建 owner 角色，并授予创建者成员实体和团队实体当前权限目录的全部权限，包括四类实体的完整 assume 权限。
固定 key、动态模式和对应业务动作见[《权限字典》](../architecture/permissions.md)，代码以 `PermissionDictionary` 为唯一事实源。

- 角色以 `role_key` 作为稳定标识；编辑时只允许修改名称、说明、排序和是否在 Display 展示。
- `is_displayed` 默认关闭，只控制角色名称与说明是否出现在已公开实体资料中，不改变任何授权行为。
- 删除角色时，服务层同步软删除角色权限和成员角色绑定。
- 保存角色权限使用完整的 `permission_keys` 集合，空数组表示清空；目录外静态 key 和不属于当前团队的动态实体 key 会被拒绝。
- 保存成员角色使用完整的 `role_ids` 集合，空数组表示清空。
- 保存实体角色以全局 slug 指定来源主体。角色始终属于当前目标团队，来源实体可以属于任意团队，也无需公开可搜索。
- 成员拥有多个角色时，业务权限取并集；实体角色关联响应会携带每个角色的权限，供本人资料页和管理员资料页展示有效权限。

身份委托使用 `identity.team.assume`，以及 `identity.member|customer|virtual.*.assume` 或对应精确 slug 权限。通配只覆盖当前授权团队；精确目标保存时必须是当前团队的有效实体。委托成功后，普通业务请求仍必须以目标实体通过 `TeamBelongs`，外部来源实体不能直接跨过团队归属边界。详细会话链与失效规则见[《Entity 身份与跨团队委托》](../architecture/entity-authorization.md)。

普通业务接口通过 `Permission:{permission_key}` 检查角色权限。角色已授予的父键同样可满足子键，例如 `team` 或 `team.ability` 可满足 `team.ability.redeem`。动态参数使用 `<slug>` 形式，例如 `chat.virtual.<slug>.manage`。一个 `Permission` 可以用逗号接收多个权限参数，控制器字符串简写为 `Permission:key-a,key-b`；数组写法 `['Permission', ['key-a', 'key-b']]` 具有相同语义，多个参数按 OR 处理。

Team 共享站内通知读取要求 `team.notice.read`；通知接口通过 `scope=team|entity` 显式选择 Team 共享站内通知或当前 Entity 收件箱，省略 scope 时保持旧版身份默认行为。`GET /notice/capabilities` 为前端返回共享站内通知查看、通知发送和默认收件箱能力。

发送通知要求 `team.notice.send`。该权限本身定义本通知模型中的上级资格，具备权限的任意当前 Entity 可以向同 Team 任意 Entity 发送，不使用角色排序建立层级。通知始终以当前 Team 名义显示，集中业务审计保留实际 acting Entity 与认证用户。通知是单向通道，不支持回复、抄送、会话、跨 Team 投递或 LostSky 直发 Entity。

加入字段读取和管理分别要求 `team.join_field.read`、`team.join_field.write`；加入申请查看和审核分别要求 `team.join_review.read`、`team.join_review.write`。人员实体字段定义和岗位类型的写操作分别要求 `team.entity_field.manage`、`team.post_type.write`。

## 加入申请与审核

申请字段独立于人员字段。管理列表返回当前团队全部申请字段，包括停用字段；访客表单只返回启用且允许申请人填写的字段。字段可通过 `is_transfer_entity_field` 和 `entity_field_id` 配置为：申请获批后自动转存到对应的 Entity 字段。`GET /joinField/transferOptions` 由 `team.join_field.write` 保护，只返回当前团队人员 Entity 字段的最小摘要，不额外要求对象字段管理 Permission。

申请状态由 `TeamJoinStatus` 枚举维护：

| 值 | 状态 |
|---:|---|
| 1 | 已申请 |
| 2 | 审核中 |
| 3 | 已取消 |
| 4 | 已加入 |
| 5 | 已拒绝 |

申请人完成以下流程：

1. 读取当前团队的申请表单。
2. 提交字段值和备注；文件可在尚未创建成员记录时上传。
3. 查询自己的申请记录和详情，或取消仍可取消的申请。

具备相应加入字段或审核权限的实体可以配置申请字段、查看申请、进入审核、维护审核任务，并最终同意或拒绝。审批通过时，服务层创建成员并转存已配置的字段值。

## 文档

团队文档由 `Document` 服务统一处理，可以归属于本团队任意有效实体，并支持管理范围、可见性、指定实体、排序和关键词筛选。`team.document.read` 表示文档全量读取；没有该权限仍可进入文档页，但只返回当前 Entity 按可见性可读取的文档。

所有文档入口都经过 `JwtAuth`、`Context`、`TeamAuth` 和 `Ability:doc`；归属与指定可见对象只接受全局 `entity_id`。

## 前端列表约束

实体与成员列表的主体操作必须复用 `LsResponsiveActions`，显示为透明、无边框的图标加文字；创建、提交和确认仍使用命令按钮。成员状态通过 `LsEntityIdentity` 的 `status` 插槽紧随名称，客户空目录使用 `LsAsyncState` 呈现标题和说明。公共规则正文见[后台组件规范](../design/admin/components.md)与[后台页面模式](../design/admin/patterns.md)，本节只登记 Team 的落点，不复制公共参数。

## 控制器约定

- 控制器位于 `app/team/controller`，类名不加 `Controller` 后缀。
- 常规动作使用 `index`、`get`、`add`、`edit`、`delete`；特殊动作使用明确的业务动词。
- 服务通过 `app(\app\service\Xxx::class)` 从容器解析，不直接实例化。
- 控制器使用 `success()`、`message()` 或 `error()` 返回统一信封，不直接调用 `json()`。
