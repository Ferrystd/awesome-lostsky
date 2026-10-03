# Team 应用

界面专属约束见[后台设计规范：Team](../design/admin/applications.md#team)；公共组件、状态和响应式规则不在本页重复。

Team 是团队工作台的核心应用，负责成员资料、顾客资料与协作关系、角色权限、团队配置、文件、文档、通知和加入审核。除加入申请的访客入口外，业务接口都以当前团队上下文为边界。

## 业务领域

文件记录的 `source` 保存首次入库类别：`unknown`（历史未知）、`manual`（文件库手动上传）、`markdown`（Markdown 编辑器）、`attachment`（普通表单附件）、`join`（加入申请）、`command`（命令上传）和 `system`（系统上传）。文件列表与详情返回该字段；同团队同内容去重及软删除恢复保留首次类别、人员与时间，不表示所有使用位置。公共上传仅接受 `attachment/markdown`，由客户端声明，不能作为权限或可信审计依据；其余入口由服务固定类别。部署执行 `sql/patches/20260913_file_source.sql`，旧记录统一保持 `unknown`。

- 个人工作台：Team、成员和虚拟实体维护当前 Entity 的资料、对象字段，并只读查看角色与有效 Permission；侧栏不提供身份切换，内容按实体类型受限。
- 成员管理：正常、封禁、离队三态，成员资料、任期留存、封禁、离队申请、复职和搜索。
- 顾客管理：按当前归属或全量 Permission 查看顾客，在顾客详情维护资料、当前归属、协作发单人和封禁状态。
- 扩展资料：实体自定义字段与字段值。
- RBAC：角色、角色权限和成员角色绑定。
- 团队设置：按应用读取配置，由团队管理者读取配置结构并保存设置。
- Chat 管理：维护本团队所属群聊、群成员、历史消息、统一实体字段、虚拟实体与 Webhook 集成；管理接口记录在 Team OpenAPI。`chat.group.manage` 覆盖所属团队群聊的全部管理操作，管理员无需先加入群，个人单聊不在此范围内。
- 内容协作：保留 LostSky 向 Team 发送的共享站内通知；同时允许有权限的当前 Entity 代表 Team 向本团队任意 Entity（包括 Team 自身）发送通知。两种通道相互隔离，每条通知的已读状态由其收件 Team 或 Entity 共享。团队文件和任意团队实体的文档通过 `entity_id` 关联全局 `entity`。
- 加入团队：申请表单、可选的全局邀请来源、申请记录、审核任务和审批；仅在链接带有邀请参数时显示只读邀请人，审批通过后把有效申请邀请人写入成员关系。
- 实体引用：为 Markdown 等场景搜索和解析可引用对象。
- 访问快照与概览：向四类 Team Entity 返回有效 Permission、Ability 状态，以及互不连带失败的实体、成员、文档、通知指标。
- 安全与审计：具备 `team.audit.read` 的当前 Team Entity 可以筛选并读取本团队成功业务写入的审计摘要与安全详情；平台事件和其他 Team 事件不可见。

具体接口路径和数据结构见 [`team.openapi.json`](../openapi/team.openapi.json)。

## 鉴权边界

Team 应用按操作组合以下中间件：

- `JwtAuth`：确认登录用户。
- `Context`：保留真实 `user_id` 用于认证和审计，只从当前 `acting_entity` 填充业务 `member`、`customer` 与实体上下文。
- `EntityRequired`：要求请求已携带有效实体会话；缺少实体时返回 HTTP 428、`code=42801` 和当前 `team_slug`。
- `TeamWorkspaceAuth`：要求有效 Entity；本团队实体通过，外部实体必须在目标团队绑定至少一个角色，具体业务再检查 Permission。
- `TeamAuth`：组合 `EntityRequired` 与 `TeamBelongs`，先要求实体，再校验实体归属。
- `EntityType`：按接口声明允许的基础用户或实体身份类型；同一声明中的多个类型按 OR 处理。
- `TeamBelongs`：确认显式实体属于当前域名解析出的团队，不重复处理状态或角色权限。
- `MemberAccess`：确认当前 actor 就是该团队的有效成员实体。
- `Permission`：按当前实体绑定角色的权限目录校验具体业务操作。
- `TeamGuest`：限制加入申请入口只能由非成员使用。
- `Ability:doc`：确认团队已开通文档能力；文档归属、管理范围和可见性由服务层控制。

控制器仅提取参数、调用服务并返回统一响应；权限判断和跨模型事务由中间件与服务层完成。

团队业务要求 `team`、`teamMember`、`teamCustomer`、`teamVirtual` 四种实体 JWT，不再从基础 JWT 静默领取成员，也不通过响应头换发令牌。
缺少实体由前端进入 Account 成员回调。团队管理接口使用 `TeamWorkspaceAuth`，外部实体缺少目标团队角色时返回 HTTP 403 / `40304`；个人、自助和成员本人接口使用 `TeamAuth`，实体不属于当前团队时返回 HTTP 403 / `40301`。旧当前成员资料与成员上传兼容接口仍只接受
`teamMember`；加入申请人的动作只接受基础用户 JWT，且不经过 `TeamAuth`。

`GET /personal`、`POST /personal/profile|slug|fields|upload` 只接受当前团队的 Team、成员或虚拟实体，并只使用 JWT 的最终叶子 Entity。写请求携带 `expected_entity_id`，身份已切换时返回 `409`。旧 `/me` 页面路由跳转 `/personal/profile`；成员专属 `/me/*` API 暂作兼容，不作为新前端入口。

`GET /access` 是当前 Entity 的通用访问快照，不依赖成员专属 `/me/get`。`GET /dashboard` 独立计算实体、成员、文档和通知：实体、成员与文档只有在具备相应全量读取 Permission 时返回计数，否则返回 `count=null`；Doc Ability 缺失时只把文档指标标记为不可用；任一指标异常不会把其余指标变成 `0`。

`GET /entity/index|get` 与 `GET /member/index|get` 不把 `team.entity.read` 或 `team.member.read` 作为页面门票。缺少实体全量读取权限时只返回有效、非 Customer 且团队内可见的实体；Customer 与隐藏实体统一返回 404。具有权限时读取完整集合。`team.entity.profile.manage` 控制资料、内部可见和公开 Display 写入，读取基础详情本身不要求该权限。

`GET /customer/index|get` 对没有全量权限的 Entity 只返回当前归属顾客；`team.customer.read` 或 `team.customer.manage` 可读取全团队顾客及详情中的协作发单人。`POST /customer/<id>` 统一使用 `team.customer.manage` 原子更新资料、当前归属、协作发单人和封禁状态；协作关系不经过 Transaction Ability 或交易 Permission。

`GET /member/get` 在成员资料之外返回当前操作者对该任务页的能力集合，包括成员编辑、字段管理、角色读取/编辑、封禁、搜索设置、slug 补全、办理离职和身份切换。前端据此裁剪整张卡片和操作入口；所有写接口仍各自执行服务端权限校验。

成员生命周期不再使用软删除：`team_member.status` 保存正常、封禁和已离队状态，`is_blocked` 仅保留为弃用兼容字段。离队通过 `/memberDeparture/index|get|mine|apply|depart|cancel|approve|reject` 完成；`depart` 仅供有 `team.member.remove` 的管理员一次办结离职，其他申请类接口保留成员自助流程。任期写入 `team_member_tenure`，第一版只后端留存。复职是 `team_join_application.purpose=reinstate`，服务端按成员状态推断目的，批准时复用原 Member 与 Entity。

## 角色与权限

角色读取与维护分别要求 `team.role.read`、`team.role.write`；新团队自动创建 owner 角色，并授予创建者成员实体和团队实体当前权限目录的全部权限，包括四类实体的完整 assume 权限。
固定 key、动态模式和对应业务动作见[《权限字典》](../architecture/permissions.md)，代码以 `PermissionDictionary` 为唯一事实源。

- 角色以 `role_key` 作为稳定标识；编辑时只允许修改名称、说明、排序和是否在 Display 展示。
- `is_displayed` 默认关闭，只控制角色名称与说明是否出现在已公开实体资料中，不改变任何授权行为。
- 删除角色时，服务层同步软删除角色权限和成员角色绑定。
- 权限目录必返普通 `groups` 与高级 `advanced_items`；身份领取归入“实体委托”，虚拟实体维护归入“实体管理”，群聊管理归入“聊天”。高级目录由固定权限和当前团队动态权限的合法前缀生成，每项包含可保存父键、范围文案和当前覆盖叶子键。
- 保存角色权限使用完整的 `permission_keys` 集合，空数组表示清空；服务端保留所有不同且合法的父子、通配符和指定 slug 键，官方前端在提交前清理覆盖冗余。目录外静态 key、未知前缀和不属于当前团队的动态实体 key 仍会被拒绝。
- 保存成员角色使用完整的 `role_ids` 集合，空数组表示清空。
- 保存实体角色以全局 slug 指定来源主体。角色始终属于当前目标团队，来源实体可以属于任意团队，也无需公开可搜索。
- 成员拥有多个角色时，业务权限取并集；实体角色关联响应会携带每个角色的权限，供本人资料页和管理员资料页展示有效权限。
- 角色权限摘要直接读取当前已分配角色的有效权限记录，不在展示时合并重复键或折叠父子键；进入查看页面不会改写数据，只有官方角色编辑器提交时生成最小权限集合。

实体委托使用 `identity.team.assume`，以及 `identity.member|customer|virtual.*.assume` 和对应精确 slug 权限。通配只覆盖当前授权团队；精确目标保存时必须是当前团队的有效实体。个人业务按 `TeamBelongs` 校验团队归属，团队工作台按目标团队角色及 Permission 授权；Chat 使用当前 Entity 的会话参与关系。Chat 不再接受独立的虚拟实体代操作权限，使用虚拟身份须在 Account 完成正式委托。详细会话链与失效规则见[《Entity 身份与跨团队委托》](../architecture/entity-authorization.md)。

普通业务接口通过 `Permission:{permission_key}` 检查角色权限。角色已授予的父键同样可满足子键，例如 `team` 或 `team.ability` 可满足 `team.ability.redeem`，并自动覆盖未来新增的同前缀权限，但不覆盖兄弟键。动态参数使用 `<slug>` 形式，例如 `team.entity.virtual.<slug>.manage`。一个 `Permission` 可以用逗号接收多个权限参数，控制器字符串简写为 `Permission:key-a,key-b`；数组写法 `['Permission', ['key-a', 'key-b']]` 具有相同语义，多个参数按 OR 处理。Team 前端访问快照保留实际父键，并使用同一分段前缀与 `*` 动态段规则判断导航和动作。

<a id="notification-mechanism"></a>

### 通知机制

Team 共享站内通知读取要求 `team.notice.read`；通知接口通过 `scope=team|entity` 显式选择 Team 共享站内通知或当前 Entity 收件箱，省略 scope 时保持旧版身份默认行为。`GET /notice/capabilities` 为前端返回共享站内通知查看、通知发送和默认收件箱能力。

团队审计读取要求 `team.audit.read`。新团队 owner 会随权限目录自动获得该权限，升级 SQL 补丁为现存有效 owner 角色补授；其他角色必须由管理员显式授权。`GET /audit/index` 和 `GET /audit/get` 只使用请求上下文中的 `team_id`，不接受外部团队参数。列表首屏只放关键词与应用，动作、资源和时间进入“更多筛选”；服务端目录必须覆盖所有实际写入的动作与资源类型，并由契约测试锁定。列表不返回 `context`，详情只返回经统一安全规范化后的上下文，并同时保留认证账号与 acting Entity；没有 acting Entity 的加入申请或首次顾客绑定只保留认证账号归因。

成功且产生状态变化的写请求必须记录；成功幂等命令同样记录并标记 `changed=false`。失败请求、读取、预检、通知已读、普通聊天消息和实时连接不写业务审计，由运行日志按 `request_id` 留痕。Team、Shop、Transaction 与 Chat 的全部 POST 路由分类由 `tests/audit_route_classification.php` 作为可执行清单维护。

发送通知要求 `team.notice.send`。该权限本身定义本通知模型中的上级资格，具备权限的任意当前 Entity 可以向同 Team 任意 Entity 发送，不使用角色排序建立层级。通知始终以当前 Team 名义显示，集中业务审计保留实际 acting Entity 与认证用户。通知是单向通道，不支持回复、抄送、会话、跨 Team 投递或 LostSky 直发 Entity。

加入字段读取和管理分别要求 `team.join_field.read`、`team.join_field.write`；加入申请查看和审核分别要求 `team.join_review.read`、`team.join_review.write`。人员实体字段定义写操作要求 `team.entity.field.manage`；字段管理员始终可以修改字段值，`manager_scope=SubjectTeam` 额外允许对象本人维护。当前权限字典和路由不提供独立岗位类型管理。

## 加入申请与审核

管理员直接添加成员使用 `POST /member/add` 的 `join_code`，不再接受用户自增 ID；沿用成员操作中间件及 `team.member.invite` 权限。对方在 Account 团队选择页生成个人一次性入队码，管理员填写后直接入队，默认不创建加入申请、不自动授予角色。码消费与成员、Entity、资料及任期创建在同一事务内完成；过期、已使用、账号封禁或删除的码不可用，添加失败不消费码。已有成员不得重复加入，封禁成员不能借码解封，离队成员仍须申请复职。本入口支持可选的 `join_form={values,memo}`：省略或 null 时保持直接入队；提供对象时复用申请字段必填校验、申请保存和批准逻辑，在同一事务中形成“已加入”记录、转存配置字段、创建任期并消费码，无需再次审核。已有待处理申请时返回 409，原申请与码均保留。`GET /member/joinForm` 和 `POST /member/joinUpload` 沿用 `team.member.invite` 与成员操作中间件，仅开放本团队启用且可由申请人填写的字段及申请文件上传，不额外要求字段管理或审核权限。

前端自行申请和管理员代填只收集团队配置的普通字段，不再提供固定“补充说明”输入，也不提交 `memo`。历史说明保留读取，现有后端可选参数仍兼容旧调用方。

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

团队文档由 `Document` 服务统一处理，可以归属于本团队任意有效实体，并支持管理范围、可见性、指定实体、排序和关键词筛选。`team.document.read` 表示文档全量读取且始终只读；没有该权限仍可进入文档页，但只返回当前 Entity 按可见性可读取的文档。文档管理员通过 `team.document.team.manage`、`team.document.member|customer|virtual.*.manage` 或对应精确 slug Permission 按归属实体授权；归属实体本人仅可管理 `manager_scope=SubjectTeam` 的文档。

团队文档接口经过 `JwtAuth`、`Context`、`TeamWorkspaceAuth` 和 `Ability:doc`；归属与指定可见对象只接受全局 `entity_id`。

## 前端列表约束

实体与成员列表的主体操作必须复用 `LsResponsiveActions`，显示为透明、无边框的图标加文字；创建、提交和确认仍使用命令按钮。成员状态通过 `LsEntityIdentity` 的 `status` 插槽紧随名称，顾客空目录使用 `LsAsyncState` 呈现标题和说明。公共规则正文见[后台组件规范](../design/admin/components.md)与[后台页面模式](../design/admin/patterns.md)，本节只登记 Team 的落点，不复制公共参数。

## 控制器约定

- 控制器位于 `app/team/controller`，类名不加 `Controller` 后缀。
- 常规动作使用 `index`、`get`、`add`、`edit`、`delete`；特殊动作使用明确的业务动词。
- 服务通过 `app(\app\service\Xxx::class)` 从容器解析，不直接实例化。
- 控制器使用 `success()`、`message()` 或 `error()` 返回统一信封，不直接调用 `json()`。
