# 总览分析模板：记账工作台概览

状态：单实例设计实现完成，等待用户批阅；未进行测试、类型检查、完整静态构建或生产验收。2026-10-16，基于 main `0c858951`，不代表已合并或可发布。

## 范围与选择

唯一实施页面为 `{team}.transaction.lostsky.work/overview`，入口源码 [TeamOverviewView.vue](../../../frontend/apps/transaction/src/views/TeamOverviewView.vue)。根路由 `/` 重定向到该页。它负责帮助团队操作者判断下一步工作入口；当前只有 `/workspace/access` 提供团队与身份，没有首页统计数据，因此用真实业务导航建立主次，不新增统计接口或模拟经营指标。

现有 `/stats` 已有真实统计查询，但它受 `transaction.report.read` 约束。本次不把统计查询移入开放概览，不用无权限数据填充首页，也不改变统计页。

## 设计契约

- 内容最大宽度 1280px，桌面主次栏为约 2:1，次栏保留可读下限；899px 以下按主业务、经营分析、当前范围的顺序堆叠。
- 主业务区「处理团队业务」以连续行呈现团队流水、权益核销、顾客余额。整个入口行可进入原路由，不将三项业务做成等大指标卡。
- 「回看经营表现」位于主业务之后，是单独的次级分析入口；从真实记录进入 `/stats`，不把尚未请求的指标画为零。
- 「本次工作范围」占较窄辅栏，团队和身份摘要保持既有查询语义。加载和错误在该区域呈现，业务导航保持稳定。个人工作台在页头保留快捷入口，在当前范围内解释登记流水的归属。
- 沿用原 `LsWorkspaceScene`、极光、透光面板、主题与角色回退。只改变本页组合和外部布局；没有新建或调整共享组件默认样式、视觉参数、全局令牌或路由 meta。

## 组件化与用户目标

| 组名 | 用户目标 | 包含项 | 拆分理由 |
| --- | --- | --- | --- |
| 处理团队业务 | 找到本次要处理的业务记录 | 流水、权益核销、余额入口 | 页面主任务，连续导航属于同一工作范围 |
| 回看经营表现 | 从业务操作切换到周期分析 | 统计说明、经营统计入口 | 分析是独立工作目标和读取权限 |
| 本次工作范围 | 确认当前团队、身份与个人业务入口 | 团队、身份、登记流水说明、个人工作台 | 独立的访问快照异步状态，不是业务指标 |

组合既有 `LsOverviewPage`、`LsSectionHeader`、`LsPanel`、`LsResourceList`、`LsResourceRow`、`LsDescriptionList`、`LsAsyncState`、`LsPageLink` 与 `LsSceneMotionControl`。这些组件各自拥有内部视觉；页面 CSS 仅定义外部宽度、轨道、对齐和组件间距，没有父级穿透、具名例外或新公共参数。

这是一次单页组合试点；「总览分析」是信息组织规则，不为名称另建一层同形外壳。其余概览先保留原实现，待本实例获批后再依据真实数据与主要任务评估。

## 权限与行为边界

`/overview` 的 `accessPublic: true` 仍是工作台级开放，不等于匿名公开：原 router 仍要求登录及合法 Entity 类型，并读取访问快照、处理工作台身份提醒。导航入口不因业务权限消失；目标页面继续负责原受限状态。

| 原入口 | 原权限/范围 | 本次处理 |
| --- | --- | --- |
| `/transactions` | `transaction.read` | 保留 |
| `/stats` | `transaction.report.read` | 保留，置于次级分析区域 |
| `/services` | `service.redemption.read` 或 `service.redemption.manage` | 保留 |
| `/balances` | `transaction.read` | 保留 |
| `/personal` | 原个人身份与团队范围守卫 | 保留 |

没有新增保存动作、变更 API/后端、改动 `transaction` Ability 判断或扩大可见数据。没有改动个人概览、经营统计或其他应用页面。

## 总览分析归属页面

下表是本模板的候选归属；只有 Transaction `/overview` 在本次实施。是否展示真实图表、关键状态还是业务导航，由各页面已有数据决定。全覆盖口径和其他分类见 [全页面模板归属清单](page-template-coverage.md)。

| 应用 | 实际路由 | 源码 | 归属理由 | 状态 |
| --- | --- | --- | --- | --- |
| admin | `/` | [views/DashboardView.vue](../../../frontend/apps/admin/src/views/DashboardView.vue) | 先看平台关键状态，再进入管理动作 | 拟归属，未实施 |
| admin | `/system` | [views/SystemView.vue](../../../frontend/apps/admin/src/views/SystemView.vue) | 先看平台关键状态，再进入管理动作 | 拟归属，未实施 |
| shop | `/manage` | [views/manage/ManageOverviewView.vue](../../../frontend/apps/shop/src/views/manage/ManageOverviewView.vue) | 团队/个人经营工作入口与当前范围 | 拟归属，未实施 |
| shop | `/manage/personal` | [views/manage/PersonalOverviewView.vue](../../../frontend/apps/shop/src/views/manage/PersonalOverviewView.vue) | 团队/个人经营工作入口与当前范围 | 拟归属，未实施 |
| team | `/` | [views/DashboardView.vue](../../../frontend/apps/team/src/views/DashboardView.vue) | 团队/个人当前范围与主要工作入口 | 拟归属，未实施 |
| team | `/personal` | [views/PersonalView.vue](../../../frontend/apps/team/src/views/PersonalView.vue) | 团队/个人当前范围与主要工作入口 | 拟归属，未实施 |
| transaction | `/overview` | [views/TeamOverviewView.vue](../../../frontend/apps/transaction/src/views/TeamOverviewView.vue) | 当前工作范围、主要业务入口或真实经营统计 | 本次已实施，待批阅 |
| transaction | `/personal` | [views/PersonalOverviewView.vue](../../../frontend/apps/transaction/src/views/PersonalOverviewView.vue) | 当前工作范围、主要业务入口或真实经营统计 | 拟归属，未实施 |
| transaction | `/stats` | [views/StatsView.vue](../../../frontend/apps/transaction/src/views/StatsView.vue) | 当前工作范围、主要业务入口或真实经营统计 | 拟归属，未实施 |
| weibo | `/overview` | [views/OverviewView.vue](../../../frontend/apps/weibo/src/views/OverviewView.vue) | 工作范围与微博业务入口 | 拟归属，未实施 |
| weibo | `/personal` | [views/OverviewView.vue](../../../frontend/apps/weibo/src/views/OverviewView.vue) | 工作范围与微博业务入口 | 拟归属，未实施 |

## 不适用与待新增类型

流水/商品/顾客等找对象页面归对象目录；已选对象及其上下文归对象档案；登记流水、商品配置与发帖归专注编辑；设置、通知、审计及治理范围归分类工作区。这些页面不因有摘要数字就改套总览。

聊天会话和点单信息流需要持续阅读与上下文动作；公开营销/人物展示需要叙事与媒体；文档/社区阅读需要正文与讨论层级；登录/领取身份和购买确认有流程边界；404/拒绝访问是系统结果。均不强塞入总览，具体应用、路由与新增建议逐项见全覆盖表。

## 真实预览与交接

- 独立工作区：`C:/awesome-lostsky-overview-template`；分支：`codex/transaction-overview-template`。
- 启动命令：`npm run dev:transaction -- --host 127.0.0.1 --port 5197`。真实 App、Shell、Router 与页面运行于本地 Vite；浏览器只给 `/api/workspace/access` 返回夹具，其余业务请求阻断，不访问生产接口。
- 桌面整页：`.codex/overview/transaction-overview-desktop.png`，1600px 视口、完整页面。团队名称及身份已在图内标注模拟；没有模拟营业额或业务统计。
- 登记组件附件：`npm run preview:components -- --components LsOverviewPage,LsResourceRow --json`；两项生成成功。PNG 仅供人类查看，没有读取、OCR 或像素比较。
- 本实例只完成渲染所需启动与采集，页面渲染时未捕获到 JavaScript pageerror；这不是权限、交互、移动端、放大文字、回归或发布验收结论。用户本次要求不运行测试、typecheck 和完整构建，也不启动子代理审查。
- 后续批阅通过后再安排实际权限下的访问、错误/加载、入口导航、窄屏和长内容检查及项目正式门禁；此处不宣称其通过。
- 保留分支、工作区和预览附件；不合 main、不 push、不部署、不更新公共 demo、不删除环境。生命周期：**已完成等待审查**。

人工用户文档只读参考 `docs/user/app/transaction.md`；本次不改变业务含义，不修改人工文档。设计说明与全覆盖表为本任务独占，未触碰公共变更日志或其他模板文档。
