# 第六模板：左对齐单面板

状态：独立工作区已实现，等待用户批阅。2026-10-17。本页独立记录第六模板，不改写五模板总表或全站覆盖表。

## 定位与选择

这是第六个独立模板，不是专注编辑的变体。适用于一个简单工作入口、说明或连续处理目标：内容无需横向比较，辅助栏只是当前身份、归属说明或重复入口。正文从工作区左边界的既有内衬开始，右侧留白。

分类工作区保留分类导航；对象目录保留集合容量；对象档案保留必要的关联资料；专注编辑保持居中；总览分析保留指标与比较空间。不能仅因名称包含“概览”就选择分析模板，也不能因为右侧有空位而增加辅助栏。

## 封闭组件契约

实现：[LsSinglePanelPage.vue](../../../frontend/packages/ui/src/components/LsSinglePanelPage.vue)（仓库路径 `frontend/packages/ui/src/components/LsSinglePanelPage.vue`）。

| 项目 | 契约 |
| --- | --- |
| props | `title: string`、`description?: string`，仅用户可见语义 |
| slots | `actions`：页级动作；`default`：连续业务分组 |
| emits / 状态 | 无；查询、权限、加载、错误与业务保存由调用方持有 |
| 边界 | 标题、说明、动作和单一主面板共享 `50rem` 上限，默认字号为 800px |
| 对齐 | `margin-inline: 0 auto`、`justify-self: start`，不在可用区域内居中 |
| 内容 | 一个 `LsPanel`；组之间 24px，组内沿用既有 16px 节奏 |
| 窄屏 | `width: 100%`、`min-width: 0`，按可用空间收缩；长文自然换行 |
| 外壳 | 继续由各应用提供全局主侧栏、导航、极光与主题；无新背景或场景开关 |
| 视觉所有者 | 模板负责正文边界；`LsPageHeader`、`LsPanel`、轻入口及输入/按钮各自持有内部视觉 |

禁止宽度、居中、布局、颜色、class/style 等万能视觉参数，关闭 attrs 透传；没有 aside 插槽。default 插槽使用标题、说明、连续列表和控件组合，不嵌套同义面板，不穿透公共组件。

这是用户明确授权的具名宽度例外：外层路由仍使用现有 `wide` 工作区；50rem 是第六模板页头与面板共同的正文边界，不是表单字段的二次限宽。在超宽屏，沿用外层 90rem 工作区的边界，不修改整个应用的全局居中规则。后续中央整合时应将此契约并入正式公共规范；本任务不修改其他模板的总表。

## 实际页面清单

所有源码路径相对仓库根目录。此次三个页面没有表单写入，未改变权限、请求、路由或保存语义。

| 状态 | 应用 / 路由 | 源码 | 理由与处理 |
| --- | --- | --- | --- |
| 已迁移 | Transaction `/overview` | `frontend/apps/transaction/src/views/TeamOverviewView.vue` | 选择团队业务入口；原右栏团队和身份收进面板前部，个人工作台重复入口合并为一处；保留团队流水、权益核销、顾客余额和经营统计 |
| 已迁移 | Shop `/manage` | `frontend/apps/shop/src/views/manage/ManageOverviewView.vue` | 商品、创建和订单入口；身份说明无需独立右栏 |
| 已迁移 | Shop `/manage/personal` | `frontend/apps/shop/src/views/manage/PersonalOverviewView.vue` | 本人商品与订单入口；保留本人/公用商品组合边界、禁止转移归属与永久删除的说明 |
| 保留总览分析 | Transaction `/personal` | `frontend/apps/transaction/src/views/PersonalOverviewView.vue` | 六项接单、发单、接待、业绩与流水指标，具有统计目标，本轮不迁移 |
| 保留总览分析 | Transaction `/stats` | `frontend/apps/transaction/src/views/StatsView.vue` | 收入结构与经营比较，保留分析空间 |
| 暂不可迁移 | Transaction `/personal/transactions/new`、`/edit` | `frontend/apps/transaction/src/views/TransactionFormView.vue` | 第四模板工作区存在未提交修改；属于编辑任务，继续保留专注编辑方向，不接管 |
| 不迁移 | Team `/settings`、`/notices/team`、`/notices/sent` | `frontend/apps/team/src/views/SettingsView.vue`、`NoticesView.vue` | 已认可的分类黄金页保持原样 |

拟迁移但尚未实施：本轮没有额外承诺的页面。上述三个适用入口均已落地；更多候选需用户批阅后另行确定，不能把未逐页核实的全站页面写为已适配。确需关联比较的对象档案继续使用第三模板。

两个 Shop 页面共用 `frontend/apps/shop/src/components/ShopOverviewWorkspace.vue`。两处同义实现及其响应式结构一并迁移：保留既有 `personal/access/steps` 业务契约，删除双栏、独立元信息卡和原私有面板 CSS。模板在三个页面复用，不添加只服务单页的视觉参数。

## 分组与内容保全

| 组 | 用户目标 / 包含项 | 分组理由 |
| --- | --- | --- |
| 本次工作范围 / 当前工作身份 | 识别团队、当前身份和资源边界 | 同一作用域；异步状态仍靠近身份信息 |
| 处理团队业务 / 管理商品 | 找到下一项业务，进入连续资源入口 | 同一操作目标，使用列表而不是并排卡片 |
| 回看经营表现 / 订单与履约 | 转入统计或持续履约任务 | 不同后续目标，以同一面板内分节表达 |
| 登记本人参与的业务 | 明确个人业务入口及范围 | 保留原右栏业务说明，重复入口只保留一次 |

第五模板参考稿为 `codex/transaction-overview-template` 的 `be1aa46f`：只读核对其工作区干净及该提交只修改概览页和两个文档。当前 main 在该页面上与共同基线一致，因此本工作区采用其连续业务入口、经营统计及工作范围内容后重新组合。没有整体 cherry-pick 旧分支，没有覆盖第五模板原稿或导入其公共覆盖表。

## 真实预览与本次验证边界

预览使用真实 Vite 应用、Vue 组件、全局导航与极光主题。请求由本地浏览器夹具返回；团队名和身份名包含“模拟数据 / 模拟身份”，未连接生产接口。PNG 只供人类查看，Agent 未打开、读图或 OCR。

- 先完成记账代表页及桌面整页预览，再迁移两个商品概览。
- 记账桌面：1600px 视口，正文 800px，左边界 276px，工作区右侧留白 524px。
- 记账窄屏：390px 视口，正文 358px，左右各 16px；文档宽度 390px。
- 商品团队与个人桌面：1600px 视口，正文各 800px，左边界均 276px；文档宽度 1600px。
- 上述页面渲染没有 `pageerror`。链接目标由渲染报告保留，不以截图宣称真实业务接口验收通过。
- 组件目录新增 `LsSinglePanelPage` 和独立 Story；预览主题仅为新 ID 接入既有极光材质。Story 提供默认、hover、focus、loading、error、mobile，模板无 active/disabled 语义并说明原因。
- 执行 `npm run preview:components -- --components LsSinglePanelPage,LsResourceRow --json` 生成最新附件。
- 按本次用户要求，不运行测试、typecheck、全量构建或长篇验收循环。尚未作真实 API、权限、写操作及全面响应式验收。

预览与渲染脚本保存在工作区忽略目录 `.codex/left-panel/`；组件 PNG 位于 `frontend/component-previews/generated/`。

## 工作区与交接

- 基线：main `b120a821`；独立分支 `codex/left-aligned-panel`，工作区 `C:/lostsky-worktrees/left-aligned-panel`。
- 本人顺序实施，无子代理、无其他聊天写入或消息委派。
- 文件归属：新模板与 Story、三页及 Shop 共用区块、本独立规范；预览目录/注册/主题只做新模板的增量接入。
- 不修改应用壳层/router、全局主题、其他五个模板、设置/通知、公共覆盖总表或人工用户文档。
- 本地依赖以 junction 复用主工作区 `node_modules` 与 `.wiki-venv`；预览端口 5198 / 5199，完成后停止服务，保留环境及附件。
- 生命周期：**已完成等待审查**。本地草稿提交，不合 main、不推送、不部署、不更新公共 demo、不删除环境。

后续整合先核对 main 和其他模板分支的新状态，特别是第五模板对同一概览页的内容变更；不能以本稿覆盖后来新增业务。
