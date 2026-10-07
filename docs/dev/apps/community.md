# Community 应用

Community 为平台与团队提供公开主题社区，统一入口为 `community.lostsky.work`。平台官方社区承载公告、更新和用户反馈；团队社区承载团队自己的内容与讨论。

## 身份与所有权

Community 是 teamless 应用，社区 slug 只定位社区。读取公开内容不需要登录；加入、发帖、评论和点赞使用当前有效 Entity，不要求 Entity 属于社区所有者团队。页面显示只读人员身份，切换通过 Account 完成并回到原地址。

社区与聊天是同等层级的独立应用。Team、Shop 管理、Transaction、Weibo 和 Chat 的共享应用导航同时提供“聊天、社区”，社区固定指向 teamless 地址，不按顾客类型、团队管理权限或付费能力隐藏。四个后台壳层复用 `workspaceAppEntries` 与 `LsWorkspaceHeader` 六等宽导航，移动端进入“操作”菜单；Shop 顾客端导航并列提供聊天和社区，Community 也提供聊天入口。Account 仅承担登录、身份选择和回跳，不放社区业务入口。社区访客登录先进入 Account 选择人员身份，再由“前往页面”返回当前社区路由；SPA 切换帖子或列表后回跳地址同步更新。已登录但没有人员身份时，“我加入的社区”使用 `LsEmptyState` 与其后的独立链接引导选择身份，不请求受保护列表；身份读取失败显示真实错误。无可领取身份时仍可通过回跳返回社区公开浏览，不要求创建团队。所有链接支持键盘与移动端，无视觉例外。通过 `tests/community-access.spec.ts` 和 `tests/workspace-entry.spec.ts` 的桌面、移动端跨应用用例验证成员、顾客、无身份与回跳路径；这些 fixture 用例不代替真实 HTTP 验收。

平台社区的 `team_id` 为空，团队社区关联一个所有者团队。官方标记只用于平台社区；首版不转移所有权，不物理删除社区。团队状态不可用时禁止新增社区及互动写入，保留已有公开内容。

| 管理入口 | 主体与授权 | 范围 |
| --- | --- | --- |
| Community | 当前 Entity 的社区管理员关系，或社区所属团队的管理 Permission | 板块、公告、内容和禁言 |
| Team | 当前 Entity，`TeamWorkspaceAuth` 与目标团队 Permission | 目标团队社区的创建、资料、状态、管理员与日常管理 |
| Admin | 当前 user，`AdminAccess` 与平台 Permission | 平台社区的创建、资料、状态、管理员与日常管理 |

管理员关系绑定全局 `entity.id`，可通过准确 Entity slug 分配跨团队的有效 Entity，不要求先加入社区。社区管理员关系不授予 Team 或 Admin 的访问权限；平台权限也不隐式授予当前 Entity 在 Community 的管理权。

## 互动与状态

首版社区均公开、自由加入。广场可查看公开社区，当前 Entity 可查看自己加入的社区；社区首页按板块查看帖子，置顶内容优先，普通帖子按发布时间倒序。

- 加入后可以发帖、评论和给帖子点赞。退出保留内容与作者，点赞关系按帖子与 Entity 唯一保存。
- 帖子包含标题和 Markdown 正文，评论采用单层结构。作者可编辑和删除自己的内容；管理员只治理状态，不改写作者正文。
- 作者删除与管理隐藏分别保存。删除内容保留状态，公开接口不返回正文；隐藏内容从普通列表移除，作者可查看处理原因。隐藏帖子后，其评论也不能公开读取。
- 禁言针对社区与 Entity，限制该社区的发帖与评论；退出再加入不能解除禁言。停止管理员的管理权需要单独移除管理员关系。
- 管理成员列表保留已经退出但仍被禁言的人员，并标明未加入；管理员可以从该列表解除禁言，人员失效也不妨碍清除旧禁言。
- 暂停社区后公开内容仍可读取，不能加入、发帖、评论或点赞；管理操作仍可处理内容。
- 停用板块保留历史帖子，不能向该板块发新帖；新社区带有默认讨论板块。
- 公告独立于普通帖子，可发布、编辑和取消置顶。Admin 发布公告以 user 记录审计，不伪造作者 Entity。

服务端按社区收口所有板块、帖子、评论、成员和管理员关系；不能通过替换下级资源 ID 访问其他社区。Entity 写操作核对页面提交的 `expected_entity_id`，避免切换身份后用新身份提交旧草稿。

## 管理权限

Team 使用 `community.team.read` 读取所属社区，`community.team.manage` 创建和管理所属社区。外部 Entity 按目标团队角色授权，不要求改变人员所属团队。

Admin 使用三个独立权限：

- `admin.community.read`：读取平台社区管理数据。
- `admin.community.write`：创建平台社区、维护资料和状态、增加或移除社区管理员。
- `admin.community.moderate`：维护板块、公告，处理帖子与评论，禁言或解除禁言。

管理页面需要读取权限；两个写权限互不代替。Admin 只管理平台拥有的社区，不能通过这组权限编辑团队社区。社区管理员不能在 Community 任命其他管理员或修改社区所有权。

隐藏内容、禁言和暂停社区须填写原因。写操作沿用集中业务审计，记录社区、动作、结果和操作者；Admin 记录真实 user，Team 与 Community 同时记录当前 Entity 和认证 user。

## 接口与数据生命周期

### 页面路由

Community 的 `/` 为广场，`/mine` 为已加入社区，`/c/:slug` 为社区首页；发帖、帖子详情和编辑分别位于 `/c/:slug/posts/new`、`/c/:slug/posts/:postId` 和 `/c/:slug/posts/:postId/edit`。治理位于 `/c/:slug/manage/:section`，section 为 `boards`、`announcements`、`posts`、`comments` 或 `members`，编辑任务使用独立子路由。

Team/Admin 的社区列表、创建、详情、编辑、管理员入口依次为 `/communities`、`/communities/new`、`/communities/:id`、`/communities/:id/edit` 和 `/communities/:id/administrators`。Team 的日常治理进入 Community；Admin 使用 `/communities/:id/manage/:section`。直接进入子页时返回所属社区或集合，保持父级导航选中。

这些页面不使用 URL query 预填或触发写入。分页从第 1 页开始，每页 20 项；搜索默认空字符串，板块与管理状态默认不筛选。列表筛选由按应用范围与当前人员隔离的页面状态维护，从详情返回恢复已有筛选；未知 query 不进入业务请求。

### API 与保留

公开资源位于 `/communities` 与 `/communities/{slug}`，下级板块、公告、帖子和评论始终归属于路径社区；`/session` 返回当前访问身份，`/mine` 返回当前 Entity 的已加入社区。Community 治理接口位于 `/communities/{slug}/manage/*`，Team/Admin 则用 `/communities/{id}` 及下级资源，并在服务层核对所属范围。

接口契约见 [Community OpenAPI](../openapi/community.openapi.json)，团队和平台管理接口分别维护在 [Team OpenAPI](../openapi/team.openapi.json) 与 [Admin OpenAPI](../openapi/admin.openapi.json)。

社区、板块、帖子和评论保留业务历史；加入、管理员、禁言和点赞是独立关系。移除管理员不删除其内容，退出不抹去禁言，隐藏不等同于删除。首版不引入定时内容清理或自动解禁任务，审计保留期沿用集中审计规则。

Markdown 正文复用现有文件激活和人员引用机制。Community 上传按当前 Entity 的所属团队与文件资格处理，和社区所有者无关；保存正文激活合法待使用文件，隐藏保留正文与引用，作者删除清空正文并解除人员引用。公告编辑保留已有合法图片；新增平台 OSS 图片必须属于当前编辑人员可用的团队文件，Admin 基础用户不能借公告接口添加无权使用的 OSS 文件。此机制不新增文件物理删除保护或独立引用账本。

已有数据库使用 `sql/patches/20261007_community.sql` 新增九张表；首次启用步骤见[部署指南](../operations/deployment.md#community-initial-setup)。迁移不创建实际官方社区，平台管理员在 Admin 中自行创建并任命管理员。

本应用不提供私密社区、加入审批、所有权转移、社区物理删除、举报工单、推荐算法、转发或积分签到。已有 Markdown 渲染、文件和身份机制按各自权限复用，不新增独立媒体系统。
