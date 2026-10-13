# 共享工作台场景与正文模板

## 范围与实施状态

本规范适用于 Team、Admin、Transaction、Weibo 与 Shop manage。Account、Chat、Community、Site、Display、Shop 顾客前台及公开页面不在本轮范围内。统一的是工作台场景能力和正文契约，不重写各应用菜单、身份、权限或业务流程。

当前批准的黄金基准为 Team `/settings`、`/notices/team`、`/notices/sent`，基线提交 `ace3c1df`。光胶形状、速度、鼠标响应、材质、间距、轻入口和紧凑通知行不得重新设计。共享底座已按以下契约提取，三个黄金路由通过适配接入；五种正文模板仅为批准的独立试点计划，尚未完成，不代表全应用已迁移。

## 共享底座契约

- `@lostsky/ui/components/LsWorkspaceScene.vue`：无业务 props，只有默认插槽；唯一持有背景实例、暂停状态及可用状态。放在现有页面限宽容器内，保留现有层叠位置，不额外贡献间距、限宽或展示高度。一次活动页面只能挂一个实例。
- `@lostsky/ui/workspace-scene`：导出 `useWorkspaceScene()`，只提供 `paused`、`available` 响应式状态；供统一控制使用，不允许模板复制 renderer 或改变其预算。
- `@lostsky/ui/components/LsSceneMotionControl.vue`：无业务 props，使用场景状态；保持现有暂停/播放按钮、可访问名称与 pressed 状态。分类模板放在左分类下原位置，其余模板通过页级辅助操作区域放置；减少动态隐藏控制。未挂场景或 WebGL 不可用时不显示。
- `@lostsky/ui/workspace-scene-theme`：`workspaceSceneProviderProps(enabled: boolean)` 开启时返回现有 `NConfigProvider` 所需的 class、theme、themeOverrides；关闭时严格返回空对象，不提供空theme或默认themeOverrides覆盖应用配置。应用先提供原provider配置，再合并该helper结果；每次路由变化重新组合，不能将开启结果保留在可变对象中。Shop公开页原darkTheme/shopTheme必须完整保留。应用继续持有唯一provider，不嵌套第二个；enabled由精确样板路由选择，不能按应用名称无条件开启。
- `@lostsky/ui/components/LsPageLink.vue`：`to`、`icon`、`label`，复用黄金基准页头轻量路由入口；不承接业务提交、禁用解释或权限判定。
- 背景实现是共享组件内部细节，原 shader、静态回退、24fps/约26万像素上限、鼠标插值、隐藏/离屏暂停、减少动态及卸载释放保持原样。现有 `lostskyAuroraTheme` 和 `.ls-theme-aurora` 材质令牌保持数值不变。只迁移归属，不趁机调色或重新设计。

所有壳层继续复用 `LsPage`、`LsWorkspaceHeader` 和各自导航。页面宽度遵循[三档宽度](page-widths.md)：form 42rem、content 64rem、wide 90rem；旧 `meta.width` 与 `meta.pageWidth` 的适配留在应用接入层，不改变现有路由含义。页头与主体间距24px；分类黄金规格为184px列、24px列距、桌面20px/手机12px内衬，内容可用宽度不足48rem时用原移动选择入口。

场景背景为fixed定位，不能假设负z-index自然低于其他兄弟元素。`LsWorkspaceHeader`新增语义`scene=false`契约：开启时由Header自身根节点持有relative定位与z-index:1；关闭保持原样。样板所属App/Shell负责把同一精确路由开关同时传给主题helper、场景挂载与Header.scene，禁止在页面穿透Header内部。侧栏、移动抽屉、弹层和底栏继续原有层级，不复制或降低既有z-index。

## 五种正文模板：独立样板计划

模板不另加 `LsPage` 限宽层，不接受任意宽度、颜色、class 或像素透传。复用现有页头、面板、表单、列表与反馈原语；业务数据、请求、权限、草稿和保存仍由页面持有。以下公共名字和最小契约是试点边界，尚不是已实现组件。

| 模板 | 拟公共契约 | 唯一真实代表页与路由 | 默认宽度 |
| --- | --- | --- | --- |
| `LsOverviewPage` | title/description；actions、summary、default插槽 | `frontend/apps/transaction/src/views/TeamOverviewView.vue`，`/overview` | wide |
| `LsCollectionPage` | title/description；actions、toolbar、default、pagination插槽 | `frontend/apps/team/src/views/DocumentsView.vue`，`/docs` | wide |
| `LsFormPage` | title/description；actions、default、footer插槽；不额外创建或接管form提交 | `frontend/apps/shop/src/views/manage/ProductFormView.vue`，仅`/manage/products/new` | form |
| `LsDetailPage` | title/description、backTo/backLabel；actions、summary、default插槽 | `frontend/apps/team/src/views/CustomerDetailView.vue`，`/customers/:id` | content |
| `LsCategoryPage` | title/description、items/current/label；actions、default插槽；select(key)事件；items包含key/label及可选dirty/to | `frontend/apps/team/src/views/RoleDetailView.vue`，`/roles/:id` | content |

分类样板保留完整角色草稿和原一次保存，不因分类导航拆成多次权限写入，不改变权限继承或授权语义。Shop样板源文件同时服务其他路由：接入必须精确限定新建团队商品样板，不扩散到个人商品和编辑路由。其他模板同样只迁移表中一个真实页面，不批量改同类页。不得修改已认可的 Settings/Notices 来完成样板。

加载、空、错误、无权限继续由页面在对应插槽复用 `LsAsyncState`、`LsEmptyState`、反馈与既有禁用解释；模板不伪造状态 props，不隐藏导航。长文和200%文字自然换行，320px起无页面横向溢出；键盘、焦点、读屏、移动选择入口保留。没有新增权限或视觉例外。

## 独立任务所有权与交付

主任务独占共享场景、renderer、主题/材质、暂停控制及黄金基准适配。五个样板在各自隔离 worktree 中实施，分别拥有自己的模板组件、代表页面、独有测试与 story/catalog 注册条目；允许新增必要 export 和精确样板路由 App/Shell/router opt-in，不得修改其他模板条目、scene核心或已认可材质。任何新公共契约需求先反馈主任务，不复制 Team 内部实现。

每个独立对话只完成“一个模板＋一个代表页面”，运行受影响测试、类型检查、完整静态构建及真实组件预览后本地提交，保留环境，等待用户检阅。不得擅自合 main、批量迁移或覆盖本机站点。后续工作由用户在对应对话继续安排。

上述等待检阅限制只约束五个独立样板任务。主任务完成共享底座验收后，沿用已授权的正常hook提交、本地合main及原设置/通知页面本机静态更新流程；不推送远端、不操作生产。

五个任务通过 Git 公共目录下的任务资源锁串行占用完整构建和浏览器重型QA资源，锁路径、持有任务及释放情况记录在各任务记录中；不新增仓库调度框架。依赖复用必须核实 `@lostsky` workspace 包指向当前任务工作区，不盲目复制五份大依赖，不写共享 node_modules 缓存。各任务使用独立预览地址或录像交付，检阅前不更新公共 demo 站点。主任务可在验证并合 main 后更新原两页本机静态资源，证明提取无回退。

## 验收

共享底座提取使用同一fixture、视口、字体与静帧条件比较黄金基准截图和DOM几何，核对shader/材质及动态参数不变；运行既有动效生命周期、面板透光、分类布局与默认主题兼容用例。避免测试服务运行时编辑触发HMR。

每个样板验证原数据/权限/草稿与操作流程，覆盖320—1920px、200%文字、长内容、空/加载/失败状态；精确opt-in路由与其相邻未迁移路由均验证。模板不能拥有或复制背景实例。类型检查、完整10应用静态构建、CORS契约和最多4个真实登记组件预览按项目门禁串行执行；PNG仅供人类查看，不用作Agent视觉输入。
