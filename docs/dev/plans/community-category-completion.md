# 分类与社区页面迁移任务清单

本对话活动目标关联的逐路由清单。基线 main `3397e3ae2c1d579c775a1fe39964e3c77be45e65`；不以旧总覆盖清单作为完成事实。

状态使用「未开始／进行中／已完成／受阻（原因）」。已完成仅指实现交付，不表示测试或验收通过。本次不运行测试、typecheck、完整构建，交主对话集中验收。

## 逐路由实施状态

| 应用 | 实际路由或分支 | 目标模板 | 源码 | 实施状态 |
| --- | --- | --- | --- | --- |
| Admin | `/audit` | 分类工作区 | `frontend/apps/admin/src/views/AuditView.vue` | 已完成（源码，待集中验收） |
| Team | `/personal/notices` | 分类工作区 | `frontend/apps/team/src/views/NoticesView.vue` | 已完成（源码，待集中验收） |
| Team | `/join-review` | 分类工作区 | `frontend/apps/team/src/views/JoinReviewView.vue` | 已完成（源码，待集中验收） |
| Team | `/departure-review` | 分类工作区 | `frontend/apps/team/src/views/MemberDepartureView.vue` | 已完成（源码，待集中验收） |
| Weibo | `/logs` | 分类工作区 | `frontend/apps/weibo/src/views/LogsView.vue` | 已完成（源码，待集中验收） |
| Weibo | `/personal/logs` | 分类工作区 | `frontend/apps/weibo/src/views/LogsView.vue` | 已完成（源码，待集中验收） |
| Team | `/communities` | 对象目录 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Team | `/communities/new` | 专注编辑 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Team | `/communities/:id(\d+)` | 对象档案 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Team | `/communities/:id(\d+)/edit` | 专注编辑 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Team | `/communities/:id(\d+)/administrators` | 分类工作区 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities` | 对象目录 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/new` | 专注编辑 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)` | 对象档案 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/edit` | 专注编辑 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/administrators` | 分类工作区 | `frontend/packages/ui/src/community/CommunityManagement.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/boards` | 分类工作区 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/boards/new` | 专注编辑 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/boards/:itemId`（已有板块） | 专注编辑 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/announcements` | 分类工作区 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/announcements/new` | 专注编辑 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/announcements/:itemId`（已有公告） | 专注编辑 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/posts/:itemId?` | 分类工作区 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/comments/:itemId?` | 分类工作区 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |
| Admin | `/communities/:id(\d+)/manage/members/:itemId?` | 分类工作区 | `frontend/packages/ui/src/community/CommunityGovernance.vue` | 已完成（源码，待集中验收） |

Admin 实际治理路由约束为 `/communities/:id(\d+)/manage/:section(boards|announcements|posts|comments|members)/:itemId?`。帖子、评论、成员传入 itemId 时仍是列表分支，沿用现有行为，不虚构编辑功能。

Team 当前 router 只有上述五个社区路由，没有 `/communities/:id/manage/...`。CommunityManagement 的团队详情以 `communityWorkspaceUrl` 链接到 `/c/:slug/manage/boards`。保留该跨应用治理入口；不新建 Team 路由、不把 Community 应用的治理算作本任务完成。

## 所有权与依赖

- 本人负责以上页面及社区管理业务组件；不使用子代理。
- Admin AuditView；Team NoticesView（仅 entity 分支）、JoinReviewView、MemberDepartureView；Weibo LogsView。
- Team/Admin CommunitiesView 共用 CommunityManagement；治理使用 CommunityGovernance。Community 应用自身的使用方保持原展示，仅管理后台分支迁移。
- 复用现有对象目录、专注编辑、对象档案、分类模板与输入控件。页面调整组合和外部布局，不修改公共基础 UI、路由、外壳、总覆盖清单或后端。
- 不改 Team `/notices/sent`、`/notices/team`、Settings 与顾客样板。保留权限、API、分页、草稿及提交载荷。

## 生命周期

独立分支 `codex/community-category-completion`。完成后本人本地提交，等待用户批阅；不合并、不推送、不部署、不删除环境。

工作区创建曾重复触发，另一个同基线空工作区保留、不写入；不影响旧分类样板现场。

## 当前未完成事项

所有25个实际路由/分支已调整源码；没有尚未实施的已分配实际页面。已完成10个模拟数据整页预览和2个登记组件预览，本地提交随本记录交付。测试、类型检查、完整构建与集中验收均未执行，归主对话。Team治理路由不存在，不计作已实施页面。

## 布局交付

- 审计按应用拆为左分类与右结果，资源/执行人筛选及表格完整信息、分页保留。
- 人事审核按加入与复职、离队拆为分类导航与右侧申请流。
- 个人收件箱把全部/未读筛选变为分类导航，标记、查询状态及详情回跳不变；团队两通知分支仍使用原分类和工具栏。
- 微博团队/个人日志按操作分类组织，搜索只过滤当前返回的最近100条记录，不改变请求范围或执行语义。
- 社区目录使用对象目录的紧凑搜索、身份与状态、拥有方和轻入口；资料表单使用单列字段、同一面板页脚统一保存；详情使用概要、资料主区与管理入口辅区；管理员使用分类导航、独立分配动作和人员列表。
- Admin治理把五分区变为分类导航；板块/公告新建和编辑使用专注编辑标题、单列资料、原统一保存。Community调用方不启用该后台布局。

## 真实预览与范围

预览来自当前真实Vue和应用路由，API全部拦截为模拟数据；没有生产请求。仅用于用户批阅，不代替交互、权限、移动端或业务验收。生成PNG未被Agent打开或分析。

输出位于 frontend/component-previews/generated/：

- CommunityManagement.png、CommunityGovernance.png：登记组件状态矩阵。
- community-directory.png、community-create.png、community-profile.png、community-administrators.png、community-governance.png、community-announcement-editor.png。
- admin-audit-category.png、team-join-category.png、personal-notice-category.png、weibo-personal-log-category.png。
- community-category-pages.json：10个实际路由预览记录，pageerror均为空。

临时捕获脚本与共享依赖junction只在忽略目录中保留；没有安装依赖。分类工作区仍沿用现有路由宽度，未私改路由。公共模板缺口：本次没有为迁移复制或新增基础模板。

## 交付状态

已完成但等待审查。未运行测试、验收、类型检查或完整构建；未合main、推送、部署。模板源码集中验收仍由主对话负责，不能以这些预览替代。
