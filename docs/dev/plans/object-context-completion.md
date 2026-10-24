# 能力与余额上下文页补齐

本文件关联当前对话的“遗漏对象档案、能力与余额上下文页面”目标。目标工具不支持修改正文，按主对话最新分配，以本清单为剩余范围：仅 Team `/abilities` 与 Transaction `/balance`。旧覆盖文档不是完成证据；不重复改造已有详情或已认可顾客档案。

## 路由状态清单

当前未完成页面：无。下表“已完成”仅表示本轮版型实施完成，集中测试与验收未执行，等待主对话处理。

| 应用与实际路由 | 当前状态 | 现状与待办 |
| --- | --- | --- |
| Team `/abilities`：能力列表、加载/错误/空/受限 | 已完成 | `frontend/apps/team/src/views/AbilitiesView.vue` → `LsDetailPage`；主区为能力授权及原有状态分支，右栏为兑换输入 |
| Team `/abilities`：检查成功后的兑换预览 | 已完成 | 同一 Vue，预览从独立整行面板移到右栏兑换面板的后续步骤；保留检查、错误、确认弹窗与兑换请求 |
| Transaction `/balance?customer_id=<id>`：明细/空/加载/错误/受限 | 已完成 | router 实际指向 `frontend/apps/transaction/src/views/BalanceLogsView.vue` → `LsDetailPage`，不是 BalanceDetailView；明细与分页在主区，顾客账户在右栏 |
| Transaction `/balance` 缺少 customer_id | 已完成 | 同源分支保留原缺少顾客 ID 提示；右栏提示从顾客余额列表选择对象，不显示伪造余额 |
| Transaction `/balance?customer_id=<id>`：账户资料加载/失败/不存在 | 已完成 | 右栏消费原 `/transaction/options` 查询，分别展示加载、错误及无账户说明；不增加查询接口、不阻断独立明细区域 |

两页均需覆盖原有加载、错误、受限、空数据分支；能力检查成功后的兑换预览保持在兑换区域，余额分页留在明细区域。这里只报告实施和真实预览，不声称测试/验收已通过。

## 版型与边界

- 两页复用现有 `LsDetailPage`，不新增公共模板、参数或全局样式。能力是当前团队的授权上下文，余额是选中顾客的账户上下文，都有独立主区和相关辅助信息，适合档案而非单面板。
- 页头保留返回、原动作与背景控制；`LsPanel` 沿用透光材质。移动端由已有 PageContextLayout 按主区、右栏顺序堆叠。
- 仅修改上述两页及本任务文档。公共 UI、router/壳层、总覆盖清单、后端接口/权限不改。
- main 基线 `3397e3ae`；工作区 `C:/lostsky-worktrees/object-context-completion`；分支 `codex/object-context-completion`。旧工作区与主分支保持原样。
- 本人执行，不创建/调用子代理或新聊天；不测试、验收、typecheck、完整构建。允许隔离数据的真实渲染，组件 PNG 只交给人类，不读取图片。
- 本地提交后等待批阅，不合 main、推送、部署、修改公共 demo 或删除环境。

## 实际入口与保持的业务契约

- Team `router.ts` 的 `/abilities` 没有路径参数，权限仍为 `team.ability.redeem`。`/ability` 列表、`/ability/card/inspect` 检查与 `/ability/card/redeem` 兑换及缓存失效均未改。
- Transaction `router.ts` 的 `/balance` 读取 query `customer_id`，源码仍以 `Number(route.query.customer_id || 0)` 取值，并在大于 0 时启用明细查询；不是 `/balances/:id`。保留 `/balances` 返回、`/recharge?customer_id=…` 充值入口、`transaction.read` 与原每页 20 条。受限时右栏值为 `-`，明细不展示，分页不显示受限缓存总数。
- 两页现有路由已经启用 workspaceScene、pageWidth=content，不需要中央补路由或公共组件。档案版型通过已有主辅列实现，不只是背景变更。
- 主对话后续明确把剩余范围收敛到以上两条路由。已存在的 Team 顾客、成员、人员与 Transaction 流水详情没有重复计入剩余，也未修改；社区、商城顾客端、Account、Display、Chat 不属于本轮。

## 真实预览与交付范围

- `node test-results/object-context/render.mjs`：成功生成 Team `/abilities`（含检查后预览）和 Transaction `/balance?customer_id=27` 的 1600×1000、390×844 整页 PNG。模拟数据仅在本地拦截返回；真实兑换/充值请求被阻断。报告 `test-results/object-context/render-report.json` 的页面错误数组为空，此事实不等同于功能或响应式验收。
- PNG 与脚本位于忽略目录 `test-results/object-context/`；仅供人类批阅，未读取图片。
- `npm run preview:components -- --component LsDetailPage --json`：生成 1 项、失败 0 项，供对照共享版型；不修改公共 story 或 catalog，生成 PNG 不作为 Agent 输入。
- 未运行测试、验收、typecheck、完整构建、静态发布或真实业务写入。未发现本轮所需公共组件缺口。
- 本轮只提交两个应用 Vue 和本专属任务文档，状态为“已完成等待审查”。
