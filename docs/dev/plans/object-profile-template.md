# 对象档案模板 · Team 顾客详情批阅稿

状态：实现完成后等待人工批阅；本轮不推广、不合并、不推送、不部署。基线为 main `0c8589512de78854003550a212967ba63ee574b3`。分支 `codex/object-profile-template`。

## 使用目标与构图

对象档案服务于“围绕一个已确定的对象理解现状、处理业务、查看关联资料”。它不承担找对象、长篇阅读或纯填写任务。

本轮唯一实例为 Team `/customers/:id`，源码 `frontend/apps/team/src/views/CustomerDetailView.vue`。继续使用路由现有 `pageWidth: content`，由壳层控制最大 64rem（默认 1024px）。保留当前极光、透光材质和主题，不更改共享组件默认值。

- 顶部：返回顾客列表、档案标题、对话入口；紧接顾客身份、封禁状态与说明。身份状态来自已保存数据，编辑中的草稿不冒充已保存状态。
- 主区：维护顾客资料。先处理当前归属与协作发单关系，再维护昵称、头像、说明和封禁；这些字段仍属于同一业务分组，一次提交、一个组末保存动作。子标题只组织阅读，不建立新的保存边界。
- 辅区：业务摘要。余额与累计充值/消费先行，订单、流水以连续区块呈现；历史归属说明紧随其后。摘要提供维护时的背景，不与主表单争夺首要位置。
- 内容容器至少 48rem 时采用 2:1 主辅列；更窄时按 DOM 顺序堆叠为身份、主表单、业务摘要。保留自然换行与最小宽度 0；数字使用等宽数字。

## 组件与操作边界

复用 `LsDetailPage`、`LsEntityIdentity`、`LsPanel`、`LsSectionHeader`、`LsDescriptionList`、`LsEntitySelect`、`LsField`、`LsMediaUploadField`、`LsSwitchField`、`LsFormActions`、`LsButton` 等已有能力。单实例布局留在页面，不制造只有模板名字不同的公共外壳；无新增共享参数、私有类名依赖或父级样式穿透。

读取、候选查询、管理权限、上传权限、草稿水合、离开保护、提交快照与保存回调保持原实现。主查询加载/错误/不存在、读取受限与只读状态保留既有分支。未增加充值、订单跳转等原页没有的动作。角色回退沿用基线。

## 实际页面归属清单

以下为本轮直接核对的对象页及邻近边界，不表示已审计所有应用。表内详情标签、页内 tab、编辑弹窗均不重复计算页面。源码路径均相对仓库根目录。

| 应用 | 实际路由 | 源码 | 归类理由 | 本轮实施 |
| --- | --- | --- | --- | --- |
| Team | `/customers/:id` | `frontend/apps/team/src/views/CustomerDetailView.vue` | 单一顾客身份、归属协作维护和经营摘要组成复合对象任务 | 是，唯一实例 |
| Team | `/member-detail?id=…` | `frontend/apps/team/src/views/MemberDetailView.vue` | 成员身份、加入信息、介绍和对象字段围绕同一成员；属于对象档案候选 | 否 |
| Team | `/member-edit` | `frontend/apps/team/src/views/MemberFormView.vue` | 修改成员资料的填写任务，归专注编辑；不因为编辑的是成员就归对象档案 | 否 |
| Team | `/entity` | `frontend/apps/team/src/views/EntityDetailView.vue` | 人员资料维护入口，需按实际编辑任务归专注编辑；不复制成员档案 | 否 |
| Shop 管理后台 | `/manage/orders/:id` | `frontend/apps/shop/src/views/manage/OrderDetailView.vue` | 单笔订单状态、金额、参与方、购买资料与完成/取消动作；属于对象档案候选 | 否 |
| Transaction 团队 | `/detail?id=…` | `frontend/apps/transaction/src/views/TransactionDetailView.vue` | 单笔流水的金额、参与人及记录信息；属于对象档案候选 | 否 |
| Transaction 个人 | `/personal/transactions/:id` | `frontend/apps/transaction/src/views/TransactionDetailView.vue` | 同一流水档案的个人范围入口，权限范围保留，不计作另一个模板 | 否 |
| Shop 顾客前台 | `/orders/:id` | `frontend/apps/shop/src/views/OrderView.vue` | 同为订单对象，但处于顾客购买流程和前台设计体系；不直接套后台模板 | 否 |

## 不适配与模板缺口

| 页面/实际路由 | 源码 | 处理建议 |
| --- | --- | --- |
| Team 通知正文 `/notices/team/detail`、`/notices/sent/detail`、`/personal/notices/detail` | `frontend/apps/team/src/views/NoticeDetailView.vue` | 正文阅读及查看情况，不是长期维护的对象档案。五类之外候选“内容阅读/回执”模板；本轮不新增。 |
| Team 文档阅读 `/doc` | `frontend/apps/team/src/views/DocumentView.vue` | 长篇正文应以阅读行长和目录组织；候选“内容阅读”模板，本轮不新增。 |
| Team 加入审核 `/join-review/review`、离队审核 `/departure-review/review` | `frontend/apps/team/src/views/JoinReviewDetailView.vue`、`MemberDepartureDetailView.vue` | 核心是证据、决定与审批状态；候选“审核处理”模板，不能把批准/驳回当普通资料保存。 |
| Team 审计事件 `/audit/:id` | `frontend/apps/team/src/views/AuditDetailView.vue` | 不可编辑的事件证据，不是对象资料；候选“事件记录”模板。 |
| Team 角色权限 `/roles/:id` | `frontend/apps/team/src/views/RoleDetailView.vue` | 主任务是配置权限，先归专注编辑；若权限树需要特殊空间，另行确认变体，不套顾客主辅信息比例。 |
| Shop 顾客服务核销 `/services/:id` | `frontend/apps/shop/src/views/ServiceView.vue` | 属顾客侧履约任务且采用前台体系；需单独设计“履约处理”，不套后台档案。 |

“模板缺口”仅为分类提案，不自动改变已经确认的五类，也不授权新增实现。

## 预览与未验收边界

整页预览使用本分支真实 Team 应用、真实路由 `/customers/27` 和实际 Vue 代码。顾客、团队、人员、金额、笔数均为浏览器拦截的模拟数据，不连接真实业务数据、不提交写请求。截图作为人工批阅附件。

按本次授权不运行测试、typecheck、全量构建或验收循环。预览成功仅证明该模拟状态可被渲染，不证明真实后端、保存、权限、移动端及回归通过。未修改人工用户文档、公共 demo、共享主题、其他模板和公共 changelog。

生命周期：已完成等待审查。保留分支、工作区和预览材料，尚未合入 main；审批前不得推广。

### 本次执行记录

- 实际路由整页渲染：`node test-results/object-profile/capture.mjs`；1600×1000 桌面视口、fullPage 截图，最终运行退出码 0，页面错误记录为空。预览脚本及模拟数据保留在忽略提交的 `test-results/object-profile/`，仅供本地重现。
- 组件附件：`npm run preview:components -- --components LsEntityIdentity,LsDetailPage --json`；生成 2 项，失败 0 项。PNG 未被 Agent 打开或分析。
- 读取受限分支保留资料占位，并在同一主辅布局中用 `-` 呈现业务摘要；该分支未进行浏览器验收。
- 最终只记录源码差异检查与本地提交，不宣称静态构建或业务测试通过。
