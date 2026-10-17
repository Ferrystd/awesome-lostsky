# 总览分析模板：完整实施记录

状态：11 个总览路由已实施，等待批阅。2026-10-17，开发基线 main `b120a821`；未合 main、推送或部署。沿用本聊天授权，不启动子代理，不运行测试、typecheck 或全量构建。

## 本次决定与范围

用户确认只完成本聊天负责的总览分析剩余页面；可能属于第六模板的页面保留。候选中，系统状态以真实健康状态为主，经营统计以真实图表为主，其余页面以工作入口或运行状态为主，均有明确的总览任务，因此本次仍覆盖原清单 11 个路由，无额外强制转类。

记账概览按批阅意见删除右侧「本次工作范围」及重复的个人工作台入口。页面标题保持面板外，业务标题放入面板 header；经营统计作为主面板 footer 内的次级入口。页头原有个人工作台入口与动效控制保留。

## 统一契约

- `LsOverviewPage` 是本任务拥有的概览模板，固定最大宽度 1280px，宽度随父容器收缩；保持 title/description、actions/summary/default 插槽，不新增视觉 props。不改变 `LsPage` 或其他正文模板。
- 工作入口、真实运行状态或真实图表是主体；资源数量、身份计数和规模汇总置于后续辅助区。辅助信息不以重复身份说明占据固定右栏。
- 业务分组标题必须在该组面板内部。页头在外；同组 footer 可承载说明和次级入口。保留现有状态、加载/失败/权限处理与动作归属。
- 多页同义导航抽象为 `LsOverviewLinks`，只承担入口链接与说明的连续行，不创建面板或另造模板外壳。调用者组合 `LsPanel` 的 header/body/footer，不嵌套资源列表边界。
- 保留极光、透明材质、按钮/输入主题和最新角色回退。没有修改共享主题、背景、公共控件默认样式，也未更改 router、API、权限、保存、草稿或用户资料。

## 页面归属与实施结果

| 应用 | 实际路由 | 源码 | 归属理由 | 状态 |
| --- | --- | --- | --- | --- |
| admin | `/` | [views/DashboardView.vue](../../../frontend/apps/admin/src/views/DashboardView.vue) | 先看平台关键状态，再进入管理动作 | 已实施，待批阅 |
| admin | `/system` | [views/SystemView.vue](../../../frontend/apps/admin/src/views/SystemView.vue) | 先看平台关键状态，再进入管理动作 | 已实施，待批阅 |
| shop | `/manage` | [views/manage/ManageOverviewView.vue](../../../frontend/apps/shop/src/views/manage/ManageOverviewView.vue) | 团队/个人经营工作入口与当前范围 | 已实施，待批阅 |
| shop | `/manage/personal` | [views/manage/PersonalOverviewView.vue](../../../frontend/apps/shop/src/views/manage/PersonalOverviewView.vue) | 团队/个人经营工作入口与当前范围 | 已实施，待批阅 |
| team | `/` | [views/DashboardView.vue](../../../frontend/apps/team/src/views/DashboardView.vue) | 团队/个人当前范围与主要工作入口 | 已实施，待批阅 |
| team | `/personal` | [views/PersonalView.vue](../../../frontend/apps/team/src/views/PersonalView.vue) | 团队/个人当前范围与主要工作入口 | 已实施，待批阅 |
| transaction | `/overview` | [views/TeamOverviewView.vue](../../../frontend/apps/transaction/src/views/TeamOverviewView.vue) | 当前工作范围、主要业务入口或真实经营统计 | 已实施，待批阅 |
| transaction | `/personal` | [views/PersonalOverviewView.vue](../../../frontend/apps/transaction/src/views/PersonalOverviewView.vue) | 当前工作范围、主要业务入口或真实经营统计 | 已实施，待批阅 |
| transaction | `/stats` | [views/StatsView.vue](../../../frontend/apps/transaction/src/views/StatsView.vue) | 当前工作范围、主要业务入口或真实经营统计 | 已实施，待批阅 |
| weibo | `/overview` | [views/OverviewView.vue](../../../frontend/apps/weibo/src/views/OverviewView.vue) | 工作范围与微博业务入口 | 已实施，待批阅 |
| weibo | `/personal` | [views/OverviewView.vue](../../../frontend/apps/weibo/src/views/OverviewView.vue) | 工作范围与微博业务入口 | 已实施，待批阅 |

| 应用 / 页面 | 具体组织方式 |
| --- | --- |
| Transaction 团队概览 | 一个主业务面板；流水、核销、余额连续入口；统计在 footer；删除身份右栏 |
| Transaction 个人概览 | 先放流水、接单、顾客和权益入口，再放原有六项真实业务统计 |
| Transaction 经营统计 | 周期控件有内部标题；真实流水趋势先于周期汇总；保留排行、排序、分页、人员和发单明细 |
| Shop 团队 / 个人概览 | 共用现有 ShopOverviewWorkspace，创建与商品管理为主，订单跟进位于 footer；移除独立身份面板，保留资源归属说明 |
| Team 团队概览 | 单个工作面板内保留团队管理 / 人事管理语义分组，连续入口；资源计数、原团队分享链接随后呈现 |
| Team 个人概览 | 工作入口在前，身份计数与团队分享链接随后；只修改 PersonalView 的 overview 模板及其专属样式，资料、字段、权限与离队动作不变 |
| Admin 平台总览 | 保留搜索与快捷键、近期用户和团队、治理关注与审计事件；六项平台规模计数移至后续汇总面板 |
| Admin 系统状态 | 健康状态、检查时间与核心依赖合为主面板；后台积压为次级面板；读取受限继续保留占位与原因 |
| Weibo 团队概览 | 真实运行摘要与下一次执行保留；异常记录先于辅助健康分解；工作导航标题收进面板，不改查询和状态计算 |
| Weibo 个人概览 | 下一次执行和失败记录为主，账号/任务状态为辅助；导航独立成有内部标题的连续入口面板 |

Shop 两页通过已有业务组件同时更新；Weibo 两路由共用 OverviewView，团队分支另使用 TeamOverviewDashboard。未迁移其他模板页面。当前全覆盖表仍为 180 页 = 五类 144 + 待新增 36，另有 11 个纯跳转；同源码多路由按路由计数。

## 新导航组件契约与所有权

`frontend/packages/ui/src/components/LsOverviewLinks.vue`：

- props：`label: string` 为 nav 可访问名称；`entries` 为只读数组，每项含 key、label、description、to（RouteLocationRaw）、icon（Vue Component）。没有 emits、slots、状态开关或视觉参数。
- 组合现有 `LsPageLink`，不拦截导航、不判断业务权限。目的页继续说明读取或操作限制。
- 唯一拥有连续行、说明文字、分隔线、间距与响应式；组件容量达到 36rem 时为入口 / 说明两列，否则上下排列。长文字允许自然换行。
- 无请求，故 loading/error/disabled 不由该组件控制；原页面请求区域保持这些真实状态。Story 说明不适用状态，不制造禁用导航。
- 真实调用覆盖 Team 两概览、Transaction 两概览、Shop 共用概览、Weibo 两概览，达到已有同义结构抽象阈值。原页面私有导航 CSS 与资源行组合随迁移删除。
- 只新增此组件和独立 Story，并最小登记 catalog / story registry；不改变已有导航、列表、面板组件的默认外观。

## 边界与第六模板候选

聊天会话、点单信息流、公开营销/人物展示、长文档/社区阅读、登录/领取身份、购买确认与系统结果页继续保留，具体路由见 [全页面模板归属清单](page-template-coverage.md)。不因为标题包含「概览」或页面存在数字就套用本模板，也不因系统健康页含状态表就排除它的总览任务。

当前源码中 Team PersonalView 的非 overview 分支由其他模板承载。本次保留来自最新 main 的表单、主辅栏、保存、草稿和权限逻辑；这份文件的本轮差异仅限概览。

## 真实渲染与未验收范围

- 工作区 `C:/awesome-lostsky-overview-template`，分支 `codex/transaction-overview-template`。已在此分支普通合并 main `b120a821`，没有在主工作区修改或整合。
- 以本地 Vite 启动五个真实应用，顺序使用 5197 端口，采集全部 11 个路由的 1600px 桌面整页。API 全部为浏览器 fixture，界面标有「设计预览 · 全部业务数据为模拟」；不存在生产读取或写入。
- 采集命令 `node .codex/overview/render-all.mjs`；输出 `.codex/overview/rollout-preview/*.png` 及 report.json。11 页均取得实际页面，未捕获 pageerror，也没有未配置的业务 API 请求；服务与浏览器在采集结束后关闭。
- 组件附件命令 `npm run preview:components -- --components LsOverviewPage,LsOverviewLinks,ShopOverviewWorkspace,TeamOverviewDashboard --json`。PNG 只供人类查看，不打开、OCR 或据其调样式。
- 真实渲染仅用于交付预览，**不是功能、权限、响应式、200% 文字、保存、回归、类型检查或发布构建验收**。这些检查按用户此前约束未执行。本地差异检查也不代替这些门禁。
- 不修改人工用户文档、公共变更日志、公共 demo；保留分支、工作区、依赖 junction 和预览附件。生命周期：**已完成等待审查**。
