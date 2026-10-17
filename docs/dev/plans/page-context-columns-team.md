# Team 页面主辅栏迁移

本轮从 main `c5a15316` 独立实施，只采用旧批阅稿的主辅信息组织，不整分支合入按钮皮肤。页面级左操作右摘要与字段级左标签右控件相互独立。

## 组件化与契约

复用 `LsFormPage`、`LsDetailPage`、`LsPanel`、`LsSectionHeader`、`LsDescriptionList`、`LsEntityIdentity`。两页模板新增可选 `aside` 插槽和 `asideLabel`，内部 `PageContextLayout` 唯一拥有 2:1 主辅轨道、1.5rem 间距与 48rem 容器断点。无右栏保持原单列。Form 的 footer 留主栏；Detail 的 summary 保持全宽。无视觉参数、父级穿透、吸顶或独立滚动。

`LsDescriptionList` 按自身实际宽度在 28rem 以下堆叠标签和值，宽容器保持既有双列；所有调用方共享此容量规则。既有 `LsFormFields` 仍按字段行实际容量在 36rem 处切换，不因页面有双栏强迫字段横排。

## 明确迁移：18 个源码入口、29 条路由

表内文件在 `frontend/apps/team/src/views/`；社区实际实现位于 `frontend/packages/ui/src/community/CommunityManagement.vue`，仅 `scope=team` 接入，Admin 原布局保留。

| 分组/目标 | 实际路由 | 文件 | 主区 | 辅区与数据来源/拆分理由 |
| --- | --- | --- | --- | --- |
| 成员加入和管理 | `/member-add`、`/member-edit?id=…` | MemberFormView.vue | 入队码/代填、对象字段、角色、搜索/状态独立操作 | 入队方式或已保存成员身份/状态/能力；既有 `/member/get`，不推断入队码对应身份 |
| 成员档案 | `/member-detail?id=…` | MemberDetailView.vue | 身份、介绍、只读对象字段 | 加入时间和邀请人；既有 member/inviter，原记录移到右栏 |
| 人员维护 | `/entity?id=…` | EntityDetailView.vue | 资料/文档分组/可见性各自保存 | 已保存类型/标识/展示范围；`/entity/get` |
| 虚拟人员 | `/chat-virtual-new`、`/chat-virtual?slug=…` | ChatVirtualFormView.vue | 资料和集成管理 | 明确标注身份草稿、已存在集成数；form 与 detail，创建和加载分开 |
| 通知发送 | `/notices/send` | NoticeSendView.vue | 收件人、正文、发送 | 选定收件人、标题、置顶草稿；既有候选和 form，不添加写请求 |
| 文档编辑 | `/doc-create`、`/doc-edit?id=…` | DocumentFormView.vue | 元数据、标签、完整正文编辑器、保存 | 当前归属/可见/维护范围和标签数；form/已有候选 |
| 对象字段 | `/field-new`、`/field-edit?id=…` | EntityFieldFormView.vue | 定义与规则配置 | 本地隔离试填、可见与维护规则；试填不进入草稿或载荷 |
| 申请字段 | `/join-fields/new`、`/join-fields/:id` | JoinFieldFormView.vue | 定义、选项、申请与转存配置 | 启用/必填/转存草稿；form 与已有转存候选 |
| 新建角色 | `/roles/new` | RoleFormView.vue | 角色基本资料、创建 | 名称/标识/公开展示草稿；权限在创建后配置 |
| 人员授权 | `/roles/entities?slug=…` | EntityRolesView.vue | 搜索、角色分配、保存 | 所选人员归属与选中角色数量；resolveEntity、roleIds |
| 群聊管理 | `/chat-groups/new`、`/chat-groups/:uuid` | ChatGroupView.vue | 名称、邀请、成员、消息管理 | 群状态/已加入/待确认与待提交选择；group/query/selected |
| 社区管理 | `/communities/new`、`/communities/:id/edit`、`/communities/:id`、`/communities/:id/administrators` | CommunitiesView.vue → CommunityManagement.vue | 资料、进入日常管理、管理员增删 | 草稿或已保存社区/管理员数量；既有 query；Team 条件插槽隔离 Admin |
| Webhook | `/chat-integration-new?slug=…`、`/chat-integration?slug=…&id=…` | ChatIntegrationFormView.vue | 配置/轮换/一次性凭据 | 所属人员、名称/订阅数/启用草稿；不复制 Token、签名密钥或 URL |
| 加入审核 | `/join-review/review?id=…` | JoinReviewDetailView.vue | 申请证据、任务编辑、审核决定 | 已保存申请类型/状态/任务完成数；detail/taskStatuses；决定不冒充资料保存 |
| 离队审核 | `/departure-review/review?id=…` | MemberDepartureDetailView.vue | 成员与决定 | 发起/决定人员和时间；既有记录移到右栏 |
| 顾客档案 | `/customers/:id` | CustomerDetailView.vue | 资料、归属协作、封禁及原子保存 | 余额/充值/订单/流水；原宽摘要转连续右栏，查询失败不伪造零值 |
| 个人独立任务 | `/personal/profile`、`/personal/fields`、`/personal/access` | PersonalView.vue | 对应资料/字段/角色权限 | 已保存当前身份、团队、角色/权限数；`/personal` |

## 保留与暂缓

- `/roles/:id` 已有分类导航和工作区双栏；保持 `LsCategoryPage`，不挤入第三栏。
- 设置分类、通知分类、全部对象目录/列表、团队与个人概览保持既有模式。
- `/doc`、三类通知详情为长篇阅读/回执；`/audit/:id` 为不可编辑事件证据，本轮不以表单摘要模式替换。
- `/join` 是公共申请流程，不属于当前后台壳层；本轮暂缓独立设计。
- 短拒绝、确认与低风险弹窗保持原行为。
- 不增加接口、虚构统计、自动保存或权限；没有因实现复杂度暂缓已具备数据的后台编辑/详情/审核页。

## 验证边界

使用真实 Vue 路由和隔离模拟接口验证 DOM 几何、主辅顺序、长文、宽窄容器、200% 字号、摘要响应与读取失败。不把模拟写载荷验收称为后端真实持久化。完整命令和退出码存于任务 verification；最终结果由交付记录补齐。
