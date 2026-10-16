# 右侧辅助栏 · 首批代表页交付

## 授权与范围

2026-10-16，用户要求执行右栏计划、不使用子代理、每个大任务后压缩上下文。本实例没有主动触发上下文压缩的工具，按阶段保存精简交接文件；没有声称已经触发压缩。按已提出的推广顺序，先完成共用布局和三个代表页供批阅，其他页面等待本批构图确认。

沿用本对话约束：不开展测试验收、typecheck、全量构建循环；允许真实页面渲染。不合 main、不 push、不部署、不删除环境、不更新公共 demo。人工用户文档未改。

- 基线：main `c937a58ae85930ca3507dddd786134fbef616141`，开始与交付检查时主工作区干净。
- 分支：`codex/form-context-sidebars`。
- 生命周期：已完成首批，等待批阅，分支和工作区保留。
- 旧顾客档案批阅稿仍保留在 `codex/object-profile-template`，未混入本批。

## 大任务完成记录

1. **共享布局**：`LsFormPage` 增加可选 aside 与 asideLabel；原页面未接入时保持旧单列结构。默认 2:1、24px 列距、48rem 内容容器断点；footer 保持在主区。规范见[表单右侧辅助区](../design/admin/form-context-sidebars.md)。交接摘要保存为本地 `test-results/form-context-sidebars/checkpoint-1.md`。
2. **代表页实施**：下表六个路由由三个源码页面覆盖；保留既有读写接口、权限、草稿与保存边界。交接摘要保存为 `checkpoint-2.md`。
3. **真实预览与归档**：模拟数据隔离渲染，阻止业务写请求；生成桌面/窄屏整页及组件附件。交接摘要保存为 `checkpoint-3.md`。这些记录用于衔接，不替代真实上下文压缩。

| 应用 | 实际路由 | 源码 | 右栏内容 | 实施 |
| --- | --- | --- | --- | --- |
| Team | `/member-add`、`/member-edit?id=…` | `frontend/apps/team/src/views/MemberFormView.vue` | 新增时说明入队方式；管理时显示已保存的成员身份、状态、搜索和管理范围 | 已实施；新增页提交入口移至主表单末尾 |
| Team | `/field-new`、`/field-edit?id=…` | `frontend/apps/team/src/views/EntityFieldFormView.vue` | 隔离的本地试填控件、当前可见与维护规则 | 已实施；试填值不进入保存载荷 |
| Transaction | `/personal/transactions/new`、`/edit?id=…` | `frontend/apps/transaction/src/views/TransactionFormView.vue` | 草稿金额、平衡状态及顾客余额 | 已实施；所有保存与业务计算保持原逻辑 |

成员管理的对象字段、角色、搜索设置和成员状态具有原有独立保存边界，本批没有强行合并。字段控件预览按现有 EntityFieldsCard 的类型优先级渲染，包括 radio 配置目前采用的选择器表现；没有借预览修改真实资料页的控件行为。

## 渲染记录

实际命令：

- `node test-results/form-context-sidebars/render.mjs`：成员管理和字段编辑生成成功；流水模拟数据缺少现有命名逻辑读取的 nickname，选择顾客时停止，未交付失败状态截图。
- 修正模拟数据后 `node test-results/form-context-sidebars/render.mjs transaction`：只补渲染流水，成功。没有重新渲染已完成的成员与字段页面。
- `npm run preview:components -- --component LsFormPage --json`：生成 1 项，失败 0 项。组件 PNG 未被 Agent 打开、读取或分析。

桌面视口 1600×1000，窄屏 390×844。Team 内容宽度 1024px，主/辅列约 667/333px；Transaction 受当前壳层可用空间影响，内容宽度 968px，列约 629/315px；两者列距 24px，保持 2:1。三个页面的渲染错误记录均为空。桌面/窄屏 PNG、浏览器隔离脚本与 JSON 报告位于忽略提交的 `test-results/form-context-sidebars/`。

这只证明所示模拟状态能渲染，不代表自动测试、真实数据、实际保存、权限回收、所有控件组合或跨页回归通过。已同步共享组件 props 契约期望；未运行测试、typecheck、静态发布构建。

## 后续推广队列

待三类代表页批阅后，按同一布局依次迁移：

- Team：人员资料、虚拟人员、发送通知、文档编辑、申请字段、角色权限、群聊/社区及 Webhook 配置。
- 商品与记账：商品、订单、充值及权益下发；长篇编辑与复杂金额表单按内容容量调整主区，不复制外壳。
- 复杂对象与审核：成员档案、申请审核、订单/流水详情；保持原权限和业务处理边界。

设置/通知分类工作区、对象目录、总览及前台不自动套入本次表单布局。不为填满右栏增加新接口、假数据或独立保存动作。
