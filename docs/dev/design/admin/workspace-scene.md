# 共享工作台场景与正文模板

## 范围与实施状态

本规范适用于 Team、Admin、Transaction、Weibo 与 Shop manage。Account、Chat、Community、Site、Display、Shop 顾客前台及公开页面不在本轮范围内。统一的是工作台场景能力和正文契约，不重写各应用菜单、身份、权限或业务流程。

当前批准的黄金基准为 Team `/settings`、`/notices/team`、`/notices/sent`，基线提交 `ace3c1df`。光胶形状、速度、鼠标响应、材质、间距、轻入口和紧凑通知行不得重新设计。共享底座已按以下契约提取，三个黄金路由通过适配接入；五种正文模板已开展独立试点，当前批准继续迁移五应用的全部内部工作台页面；下文是实施与验收计划，不表示这些页面已迁移或通过验收。

## 共享底座契约

- `@lostsky/ui/components/LsWorkspaceScene.vue`：无业务 props，只有默认插槽；唯一持有背景实例、暂停状态及可用状态。放在现有页面限宽容器内，保留现有层叠位置，不额外贡献间距、限宽或展示高度。一次活动页面只能挂一个实例。
- `@lostsky/ui/workspace-scene`：导出 `useWorkspaceScene()`，只提供 `paused`、`available` 响应式状态；供统一控制使用，不允许模板复制 renderer 或改变其预算。
- `@lostsky/ui/components/LsSceneMotionControl.vue`：无业务 props，使用场景状态；保持现有暂停/播放按钮、可访问名称与 pressed 状态。分类模板放在左分类下原位置，其余模板通过页级辅助操作区域放置；减少动态隐藏控制。未挂场景或 WebGL 不可用时不显示。
- `@lostsky/ui/workspace-scene-theme`：`workspaceSceneProviderProps(enabled: boolean)` 开启时返回现有 `NConfigProvider` 所需的 class、theme、themeOverrides；关闭时严格返回空对象，不提供空theme或默认themeOverrides覆盖应用配置。应用先提供原provider配置，再合并该helper结果；每次路由变化重新组合，不能将开启结果保留在可变对象中。Shop公开页原darkTheme/shopTheme必须完整保留。应用继续持有唯一provider，不嵌套第二个；enabled由主对话维护的内部工作台路由集合选择，不能按应用名称无条件开启；排除路由保持原主题。
- `@lostsky/ui/components/LsPageLink.vue`：互斥的 `to` / `href`、`icon`、`label`，复用黄金基准页头轻量导航入口；可明确传入 `target` / `rel`，默认同窗口，不增加动作回调；不承接业务提交、禁用解释或权限判定。
- 背景实现是共享组件内部细节，原 shader、静态回退、24fps/约26万像素上限、鼠标插值、隐藏/离屏暂停、减少动态及卸载释放保持原样。现有 `lostskyAuroraTheme` 和 `.ls-theme-aurora` 材质令牌除下述已批准的输入面调整外保持数值不变。只迁移归属，不趁机调色或重新设计。

### 输入面材质

极光工作台的 Naive `NInput`（含 `LsInput`、搜索与 textarea）统一采用轻微内凹的深色输入面：`lostskyAuroraTheme.Input` 持有透明度 .72 的深色底、弱化的常态边框及清晰青绿色聚焦边框；`.ls-theme-aurora` 下由共享样式提供极淡顶部内阴影。禁止页面私有覆盖、外发光和输入面渐变。普通主题、选择器和编辑器不在本次调整范围，无新增例外。

桌面与手机使用同一材质，保留圆角、留白、字号、textarea 高度和字数统计；键盘焦点继续使用 Naive 状态边框。错误与警告保留对应语义边框，聚焦不添加外发光；禁用输入保留原底色与边框且不加内阴影，只读状态沿用输入面。加载、空值、权限与业务校验由原页面负责，不增加动效。以真实组件 DOM 验证透明底、内阴影、聚焦/错误/禁用、输入与计数、320px 和文字放大无溢出，并核对关闭场景后普通主题不变。

所有壳层继续复用 `LsPage`、`LsWorkspaceHeader` 和各自导航。页面宽度遵循[三档宽度](page-widths.md)：form 42rem、content 64rem、wide 90rem；旧 `meta.width` 与 `meta.pageWidth` 的适配留在应用接入层，不改变现有路由含义。页头与主体间距24px；分类黄金规格为184px列、24px列距、桌面20px/手机12px内衬，内容可用宽度不足48rem时用原移动选择入口。

场景背景为fixed定位，不能假设负z-index自然低于其他兄弟元素。`LsWorkspaceHeader`新增语义`scene=false`契约：开启时由Header自身根节点持有relative定位与z-index:1；关闭保持原样。主对话独占的App/Shell接入层负责把同一精确路由开关同时传给主题helper、场景挂载与Header.scene，禁止在页面穿透Header内部。侧栏、移动抽屉、弹层和底栏继续原有层级，不复制或降低既有z-index。

## 五种正文模板与完整迁移

模板不另加 `LsPage` 限宽层，不接受任意宽度、颜色、class 或像素透传。复用现有页头、面板、表单、列表与反馈原语；业务数据、请求、权限、草稿和保存仍由页面持有。以下为各独立工作区沿用的最小契约；主分支是否接纳，以提交及集中验收记录为准。

| 模板 | 公共契约 | 原代表页与路由 | 默认宽度 |
| --- | --- | --- | --- |
| `LsOverviewPage` | title/description；actions、summary、default插槽 | `frontend/apps/transaction/src/views/TeamOverviewView.vue`，`/overview` | wide |
| `LsCollectionPage` | title/description；actions、toolbar、default、pagination插槽 | `frontend/apps/team/src/views/DocumentsView.vue`，`/docs` | wide |
| `LsFormPage` | title/description；actions、default、footer插槽；不额外创建或接管form提交 | `frontend/apps/shop/src/views/manage/ProductFormView.vue`，`/manage/products/new` | form |
| `LsDetailPage` | title/description、backTo/backLabel；actions、summary、default插槽 | `frontend/apps/team/src/views/CustomerDetailView.vue`，`/customers/:id` | content |
| `LsCategoryPage` | title/description、items/current/label；actions、default插槽；select(key)事件；items包含key/label及可选dirty/to | `frontend/apps/team/src/views/RoleDetailView.vue`，`/roles/:id` | content |

原代表页不再是迁移数量上限，以下完整文件归属取代“一个模板＋一个样板”限制。同源文件的不同路由只能由一个对话负责，保留原拓扑、权限、完整草稿和保存边界，不强行改造成另一类页面。不得修改已认可的 Settings/Notices 来完成迁移。

加载、空、错误、无权限继续由页面在对应插槽复用 `LsAsyncState`、`LsEmptyState`、反馈与既有禁用解释；模板不伪造状态 props，不隐藏导航。长文和200%文字自然换行，320px起无页面横向溢出；键盘、焦点、读屏、移动选择入口保留。没有新增权限或视觉例外。

## 完整文件归属与中央边界

以下为分派给五对话的互斥87个view，不是全部路由数量；另有中央保留的黄金页面、后台社区管理与异常外壳。分派数为：概览9、集合36、表单24、详情14、分类4。文件名均相对 `frontend/apps/<应用>/src/views/`，省略 `.vue`；Shop均在该目录的 `manage/` 子目录。一份源文件只能有一个写入者。

| 所有者 | 应用 | 完整view清单 |
| --- | --- | --- |
| 概览 | Team | DashboardView |
| 概览 | Admin | DashboardView、SystemView |
| 概览 | Transaction | TeamOverviewView、PersonalOverviewView、StatsView |
| 概览 | Weibo | OverviewView |
| 概览 | Shop manage | ManageOverviewView、PersonalOverviewView |
| 集合 | Team | AbilitiesView、AuditView、ChatGroupsView、ChatVirtualsView、EntityFieldsView、EntitiesView、RolesView、JoinFieldsView、JoinReviewView、MemberDepartureView、MembersView、CustomersView、DocumentsView、FilesView |
| 集合 | Admin | UsersView、TeamsView、AdministratorsView、RolesView、AuditView、EntitlementPackagesView、EntitlementCampaignsView |
| 集合 | Transaction | TransactionsView、PersonalWorkspaceView、PersonalCustomersView、PersonalEntitlementsView、ServicesView、BalancesView、BalanceLogsView |
| 集合 | Weibo | AccountsView、TasksView、LogsView、CommentPresetsView、FeedView |
| 集合 | Shop manage | ProductsView、OrdersView、PersonalOrdersView |
| 表单 | Team | ChatGroupView、ChatVirtualFormView、ChatIntegrationFormView、EntityFieldFormView、RoleFormView、JoinFieldFormView、MemberFormView、DocumentFormView、NoticeSendView |
| 表单 | Admin | AdministratorFormView、TeamAbilityGrantView、EntitlementPackageFormView、SiteContentView、EntitlementCampaignView |
| 表单 | Transaction | TransactionFormView、EntitlementGrantView、RechargeView |
| 表单 | Weibo | AccountBindingView、CommentPresetFormView、InteractionView、OperationView、TaskFormView |
| 表单 | Shop manage | ProductFormView、OrderFormView |
| 详情 | Team | CustomerDetailView、MemberDetailView、EntityDetailView、AuditDetailView、JoinReviewDetailView、MemberDepartureDetailView、DocumentView、NoticeDetailView |
| 详情 | Admin | UserDetailView、TeamDetailView |
| 详情 | Transaction | TransactionDetailView、ServiceDetailView、PersonalServiceTaskView |
| 详情 | Shop manage | OrderDetailView |
| 分类 | Team | RoleDetailView、EntityRolesView、PersonalView |
| 分类 | Admin | RoleFormView |

概览对话另独占 `frontend/apps/weibo/src/components/TeamOverviewDashboard.vue` 和 `frontend/apps/shop/src/components/ShopOverviewWorkspace.vue`。每个对话拥有自身模板组件及独立story文件，不修改其他模板。`TeamShareLinks`、`PersonalServiceLists`、`OperationRecordList`等未分配复用业务组件留中央；需要修改时交接具体需求。

Team `ChatGroupView`的新建/管理、Admin `EntitlementCampaignView`的新建/详情/兑换码、Admin `RoleFormView`的新建/编辑权限、Team `PersonalView`的概览/资料/字段/访问分支均由同一文件所有者保留。内部个人工作台在范围内，包括 Team `/personal*`、Transaction `/personal*`、Weibo `/personal*`、Shop `/manage/personal*`，不能与顾客前台混淆。

主对话独占：

- 各应用App、Shell、Header包装、router/meta、场景路由集合与主题接入。子对话交接需启用的全部路由及参数/query约束，由中央统一opt-in，不并行修改接入文件。
- 共享scene、renderer、theme/material、暂停控制、LsPageLink及其他公共原语、公共export、catalog、聚合story注册、全局契约测试和规范。子对话实现自身模板及独立story，注册与公共依赖由中央整合，不盲目依赖尚未接纳的其他模板。
- 黄金Team `SettingsView.vue`、`NoticesView.vue`及适配保持原样；Notices同源个人分支也留中央处理。
- Team/Admin `CommunitiesView.vue`及共享 `@lostsky/ui/community/CommunityManagement.vue`由中央统一迁移，不代表Community应用纳入范围。Admin ForbiddenView、Shop NotFound等异常外壳留中央。

Team `/join`、Shop非`/manage`公开/顾客页面及其他应用不迁移。未路由的旧文件不为凑齐范围而激活：Shop manage的CampaignCodesView/CampaignFormView/CampaignsView/PackageFormView/PackagesView/ServiceFormView/ServicesView，Team DetailView/ProfileView及当前无有效资源路由的ResourceView不在本批清单。发现新增路由或未分配文件，先由中央确定唯一所有者。

## 轻入口与业务动作

导航、查看、返回等页面跳转采用黄金基准的灰文字图标 `LsPageLink`，按目的地选择to或href，保留权限、地址、query和原窗口行为，不统一改成新窗口。图标表达用途，不将所有入口换成钥匙。

保存、提交、确认、删除、增删表单项、开关、暂停保留原业务按钮或标准控件，保留主次、危险、loading、disabled和权限解释。展开/弹窗是本地动作，不能伪装为导航；原生details/summary可采用轻文字、图标与focus样式，但保持disclosure及键盘语义。有复杂点击副作用的入口保留原动作语义，不因外观相似一键替换全部按钮。不向LsPageLink增加click/variant万能接口，不改变分类选中态。

## 独立任务交付与集中验收

五个既有对话在各自隔离worktree直接实施所分配的模板、全部页面及明确归属组件，不使用子agent，不再只做一个样板。它们不运行测试、类型检查、构建、真实组件预览或验收；已运行的检查可正常收尾并移交结果，不启动下一项。全部新测试与验证由主对话统一负责，项目门禁不降低。

完成后冻结源码，交接分支/HEAD、staged/unstaged边界、精确文件清单、场景路由集合、功能/权限约束、原预览入口与已有证据、未验收项。待验收不得描述为通过；子对话不得擅自合main、push、发布、覆盖公共demo或清理环境。当前批准实施不表示用户已检阅或中央已接纳。

主对话独占集成、共享依赖与验证排期，通过Git公共目录的 `codex/workspace-template-validation.lock` 串行执行重型QA与构建，只释放自己持有的锁。依赖复用必须核实@lostsky workspace包指向当前工作区，不盲目复制五份大依赖，不写共享node_modules缓存。子对话保留原预览服务和证据，不为交接启动新预览构建。

此前主任务共享底座正常hook提交、本地合main与原两页本机更新授权，不代表五个迁移分支可自行合并或发布。后续统一集成、验收与交付由主对话依用户授权处理，不操作生产。

## 验收

共享底座提取使用同一fixture、视口、字体与静帧条件比较黄金基准截图和DOM几何，核对shader/材质及动态参数不变；运行既有动效生命周期、面板透光、分类布局与默认主题兼容用例。避免测试服务运行时编辑触发HMR。

主对话集中验证各迁移页面及模板的原数据/权限/草稿与操作流程，覆盖320—1920px、200%文字、长内容、空/加载/失败状态；精确opt-in路由与其相邻未迁移路由均验证。模板不能拥有或复制背景实例。类型检查、完整10应用静态构建、CORS契约和最多4个真实登记组件预览按项目门禁串行执行；PNG仅供人类查看，不用作Agent视觉输入。
