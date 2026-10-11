# Team 页面宽度审计

本表覆盖全部具有页面组件的 Team 路由。数值与类型判定固定采用[页面宽度规范](page-widths.md)：`form=42rem`、`content=64rem`、`wide=90rem`。列表/概览为 wide，独立填写为 form，复合管理/阅读为 content。

虚拟人员新建是 form；编辑页含 Webhook 集成集合，保留 content。成员编辑含身份和角色管理，顾客详情含经营摘要与资料维护，均为 content；顾客表单不再自行限宽。文档新建/编辑使用多模式富文本编辑器，按 content 任务处理。

具名子区域例外：`/doc` 与通知详情的正文保留 `72ch` 阅读行长；文档标题 `22ch`、空正文说明 `34rem`、成员危险操作说明 `55ch` 只限制文字阅读长度，不改变面板/页头/操作边界。公共 `/join` 不经过工作台壳层，保留申请加入的独立双区页面，标为 public；若今后迁入工作台，必须改为显式标准宽度。未路由的历史 `DetailView.vue` 不构成现行页面。

`/notice`、`/notice-detail`、`/notice-send`、`/me` 只重定向到表中目标，不创建独立宽度。动态资源路由工厂显式 wide，当前全部资源均被专用页面替换，没有额外运行路由。

验证由 `tests/team-page-widths.spec.ts` 自动枚举运行路由并逐页记录 1920px 下的真实容器宽度；受限数据夹具仅验证路由与容器，不冒充各页完整业务验收。已填充的列表/设置通过 `team-page-consistency.spec.ts` 与设置专项覆盖 320–1920px、200% 字号、页头对齐、保存位置、权限/草稿及原有原子提交。每次路由新增必须同时更新本表。

共 57 个页面路由：56 个工作台页面（form 15、content 22、wide 19），另有公开加入页 1 个。4 个重定向不重复计数。

| 具名规则 | 理由与边界 | 失效条件与检查 |
| --- | --- | --- |
| `/settings` 使用 content | 184px 分类导航与当前组编辑共同组成设置中心；Group 是唯一编辑表面，窄容器改为顶部选择器 | 若变为单一业务组普通填写任务，重评 form；分类切换草稿、保存归属及 320–1920px/200% 字号 DOM 验证 |
| `/doc-create`、`/doc-edit` 使用 content | 富文本编辑器包含源码、预览与候选工具，不按普通单输入表单限宽 | 移除复杂编辑器后重评 form；综合 Team 路由 E2E 检查实际编辑页无溢出 |
| `/chat-virtual`、`/member-edit`、`/customers/:id`、群聊管理及权限分配使用 content | 同一对象下的资料、关联集合或权限协作属于复合管理任务 | 拆成纯填写任务后改用 form；路由尺寸枚举与非空顾客/虚拟人员专项验证 |
| `/doc`、三个通知详情正文 `72ch` | 限制阅读行长，不缩小页头、正文面板或操作区域 | 正文改为结构化管理数据后撤销；文档阅读 E2E 与源码审计核对 |
| 文档标题 `22ch`、空正文说明 `34rem`、成员危险区说明 `55ch` | 仅文字排版子区域，不控制业务容器 | 文字用途改变或出现对齐问题时撤销；综合 Team E2E 检查内容与动作无页面溢出 |
| `/join` 独立公开申请页 | 非工作台、有独立身份确认与申请布局 | 迁入工作台时必须采用三档；保持既有加入申请测试，当前只审计不改布局 |

| 路由 | 页面 | 宽度 |
| --- | --- | --- |
| `/communities` | 团队社区 | `wide` |
| `/communities/new` | 创建社区 | `form` |
| `/communities/:id` | 社区详情 | `content` |
| `/communities/:id/edit` | 编辑社区 | `form` |
| `/communities/:id/administrators` | 社区管理员 | `content` |
| `/` | 概览 | `wide` |
| `/personal/notices` | 收件箱 | `wide` |
| `/personal/notices/detail` | 阅读通知 | `content` |
| `/notices/sent` | 通知中心 | `content` |
| `/notices/sent/detail` | 通知查看情况 | `content` |
| `/notices/team` | 通知中心 | `content` |
| `/notices/team/detail` | 阅读站内通知 | `content` |
| `/notices/send` | 发送通知 | `form` |
| `/files` | 文件 | `wide` |
| `/settings` | 团队设置 | `content` |
| `/abilities` | 团队能力 | `content` |
| `/audit` | 审计日志 | `wide` |
| `/audit/:id` | 审计事件 | `content` |
| `/chat-groups` | 聊天管理 | `wide` |
| `/chat-groups/new` | 创建群聊 | `form` |
| `/chat-groups/:uuid` | 管理群聊 | `content` |
| `/chat-virtuals` | 虚拟人员 | `wide` |
| `/chat-virtual-new` | 创建虚拟人员 | `form` |
| `/chat-virtual` | 编辑虚拟人员 | `content` |
| `/chat-integration-new` | 创建 Webhook 集成 | `form` |
| `/chat-integration` | 编辑 Webhook 集成 | `form` |
| `/fields` | 对象字段 | `wide` |
| `/entities` | 人员 | `wide` |
| `/entity` | 人员资料 | `form` |
| `/field-new` | 创建对象字段 | `form` |
| `/field-edit` | 编辑对象字段 | `form` |
| `/roles/new` | 新建角色 | `form` |
| `/roles/entities` | 人员角色分配 | `content` |
| `/roles/:id` | 编辑角色权限 | `content` |
| `/roles` | 角色权限 | `wide` |
| `/join-fields/new` | 创建申请字段 | `form` |
| `/join-fields/:id` | 申请字段 | `form` |
| `/join-fields` | 申请字段 | `wide` |
| `/join-review/review` | 审核加入申请 | `content` |
| `/join-review` | 人事审核 | `wide` |
| `/departure-review/review` | 审核离队申请 | `content` |
| `/departure-review` | 人事审核 | `wide` |
| `/members` | 成员 | `wide` |
| `/customers` | 顾客 | `wide` |
| `/customers/:id` | 顾客详情 | `content` |
| `/member-add` | 添加成员 | `form` |
| `/member-edit` | 编辑成员 | `content` |
| `/docs` | 文档 | `wide` |
| `/doc-create` | 新建文档 | `content` |
| `/doc-edit` | 编辑文档 | `content` |
| `/member-detail` | 成员详情 | `content` |
| `/doc` | 文档 | `content` |
| `/personal` | 概览 | `wide` |
| `/personal/profile` | 资料 | `form` |
| `/personal/fields` | 对象字段 | `content` |
| `/personal/access` | 角色与权限 | `content` |
| `/join` | 申请加入 | `public` |
