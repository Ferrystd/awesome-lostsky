# 后台公共组件

## 已批准后台模板接入

Transaction、Admin、Weibo 与 Shop 管理后台此次采用[后台翻新规范](backoffice-renovation.md)。`LsOverviewPage`、`LsObjectDirectory`、`LsCategoryPage`、`LsDetailPage`、`LsFormPage`、`LsSinglePanelPage` 与 `LsCollectionPage` 是各自内容任务的视觉所有者，不接受任意视觉透传；标题、说明、上下文名称及语义插槽沿用保留分支已批准契约。无辅助区的 `LsFormPage` 上限 42rem；有实际上下文时沿用 2:1 辅助区。`LsField` 的 `description/readOnly` 仅表达字段语义，横向字段轨道由 `LsFormFields` 的上下文提供，未置于该上下文的旧字段保持原布局。

场景 Provider 只由应用根节点提供，业务页面不重复注入主题。Account、Chat 保留基线组件与默认主题。Team 私有 UI 与场景保持原契约；未启用 `.ls-theme-aurora` 的前台保留基础外观。

## Shop 结单时限设置

`ServiceCompletionSettings` 为 Shop 内部业务组件，由商品、规格及兼容服务表单共用；复用 `LsField` 和 `NInputNumber`，不创建新的视觉原语。仅接受 `idPrefix` 与两个可空分钟模型 `unusedMinutes`、`confirmationMinutes`，没有样式、尺寸参数或父级穿透。

两项独立保存：未发起核销时限从购买或赠送权益起计时，仅处理未使用未预占额度；顾客确认时限从接单人请求结单起计时。均为 1–5256000 的整数分钟，清空为 `null`，不互相回填。组件负责标签、说明、可聚焦清空控件；加载、权限和提交错误由表单负责。桌面移动保持标准单列字段结构，无例外。通过 `auto-complete.test.ts`、商品编辑 E2E、真实组件预览验证独立回填、清空与提交。

## 组件体系边界

后台唯一组件体系是 `Naive UI 2.44.1 + @lostsky/ui`。标准输入、选择、按钮、标签、分页、弹层、提示和日期控件必须使用 Naive UI；业务语义组件放入 `@lostsky/ui`。禁止引入 PrimeVue，禁止复制 shadcn-vue 组件，禁止用原生元素和页面私有 CSS 重造已有控件。

所有后台应用根节点必须注入 `NConfigProvider`、`zhCN`、LostSky 主题和 Lucide 1.8 描边；需要消息或对话框的应用在根部注入 Provider。页面不得再次创建主题 Provider。

## 组件契约

| 组件 | 必须用途与参数 | 禁止组合 | 状态与响应式检查 |
| --- | --- | --- | --- |
| `LsButton` | `variant=primary/secondary/ghost/danger`、`size=sm/md/lg`、`loading`、`disabled`、`disabledReason`、`type=button/submit/reset`；`icon` 插槽承载命令图标；是唯一可见命令按钮原语 | 页面私有按钮皮肤、同组混合尺寸、在默认插槽中反复手排图标间距、页面用外层 `span` 重做可解释禁用 | loading 保留尺寸；disabled 无原因时使用原生禁用，有原因时保留焦点并统一短时提示且绝不触发表单；40/44/48px；图标不改变可读文案 |
| `LsInlineError` | 只接收必填 `message`；用于字段组、表单或局部操作的阻断错误 | 自定义颜色、图标、标题、动作、插槽或重复书写 `role=alert` | 固定区域 `alert`、危险色和紧凑内边距；长文案与 200% 文本自然换行；空状态和页面加载错误不得使用 |
| `LsPanel` | 无 props；`header/default/footer` 三个插槽承载有边界的独立内容区 | 视觉变体、页面级 `.panel` 皮肤、嵌套面板、为连续列表逐项套面板 | 桌面 20px、移动端 16px 内边距；插槽边界使用细分隔线；加载、空、错误由内容区对应状态组件表达 |
| `LsSectionHeader` | `title` 必填；`description/eyebrow/id` 可选，`headingLevel=2/3/4`；`aside` 插槽承载状态、统计或区块动作 | 页面手写 `section-heading/panel-heading/section-title`；在页面重复标题间距和移动端堆叠 | 标题层级与 ID 保留；说明宽度统一；右侧内容桌面靠右、移动端堆叠，命令按钮满宽 |
| `LsFormSection` | `title` 必填，标题参数与 `LsSectionHeader` 相同；内部固定复用 `LsPanel` 与 `LsSectionHeader`，默认插槽承载单列表单字段 | 接管 `<form>`、校验、提交或业务数据；页面重建 `form-panel` | 通过标题 ID 标记面板；字段单列且长文案不溢出；状态由字段或表单区域表达 |
| `LsFormActions` | 无 props、默认插槽承载保存、取消等命令 | 视觉参数、业务顺序判断、页面重建 `form-actions` | 桌面右对齐并换行，命令按文案自适应且最小 7rem；小于 640px 双动作两列，`LsButton` 填满各列；不改变按钮本身状态 |
| `LsDescriptionList` | 无 props；根节点固定为 `<dl>`，默认插槽只提供成对 `<dt>/<dd>` | 指标网格、金额分解、移动表格记录或卡片式业务摘要 | 桌面双列、移动上下排列；统一分隔线和长内容换行；调用端保留术语和值的语义 |
| `LsStatusTag` | `label` 必填，`type=default/success/warning/error/info`；统一状态标签 | 调用端重复 `size=small`、`bordered=false`，或按页面自建 StatusBadge | 固定 small、无边框；颜色不能替代文案；移动端和文本放大时不裁切状态文案 |
| `LsPage` | `as=main/section/div`（默认 `section`）、`width=wide/content/form`（默认 `wide`）、`id`；分别用于列表、详情、单列表单 | 页面再嵌套同类容器 | 320px 无横向溢出，桌面居中；页面只能有一个 `main` |
| `LsPageHeader` | `title` 必填；`description`、`backTo`、`backLabel` 可选；`actions` 插槽只承载当前区域动作 | 页面自行复制标题栏；移动端堆叠孤立图标 | 标题层级唯一；返回区 44px；小屏标题左上、双动作右上、说明跨列在下，长文案自然换行；详情页复用此动作布局；无返回目标时不渲染返回入口 |
| `LsPagePrimaryAction` | `icon/label` 必填；`to`、`href`、`type`、`loading`、`disabled/disabledReason` 可选；只承载页面标题区唯一的主操作，发出 `click` | 页面手写 `primary-link`；把 `RouterLink` 套在按钮外；省略图标；把危险、次要、筛选、状态或表单底部命令并入；调用方传宽度、尺寸或视觉变体 | 始终为主色图标加文字；桌面与移动端统一为 8.5rem × 44px、10px 圆角，容器不足时才收缩且保持靠右；移动端标题与限宽说明保留在左列，主操作位于右列并与说明顶边对齐；禁用态保留主色来源并以灰绿色降权，禁用原因可解释；内部路由渲染真实链接，命令由本组件的固定语义按钮执行 |
| `LsWorkspaceHeader` | `contextLabel/title` 必填，`actions=[]`、`showMenu=true`；桌面应用入口由 `actions` 插槽承载，移动端按 `actions` 数据触发 `action` 事件 | 在组件内部增加应用下拉或个人/团队分段控件；移动端复制第二套顶栏；把响应式类直接传给无根 `NDropdown`；把顶栏设为 `sticky/fixed` 后覆盖滚动中的表单控件 | 桌面动作使用图标加文字；移动端进入“操作”菜单；禁用原因随菜单项保留；应用壳层负责保持当前团队与 Entity；顶栏参与正常文档流，滚动、聚焦和错误定位后不得遮挡字段 |
| `LsWorkspaceOverview` | `eyebrow/title/description/actions/entries` 必填，`scopeNotes` 可选；动作支持内部路由、外部地址和主次层级；入口包含图标、标题、说明与目标；`summary` 插槽承载主视觉下方身份或指标摘要，`workspace` 插槽替换默认业务入口及范围说明 | 用无业务意义的指标填充概览；页面私有复制主视觉或入口卡片；按 Permission 隐藏或禁用入口；把应用切换或分段控件塞入概览；插槽穿透内部样式 | 深色主视觉、主入口 `--afterglow`、白色细边界入口；全部入口使用真实链接并始终可导航，授权降级在目标页面处理；桌面主视觉固定为 188px，800px 以下由内容自然撑高；桌面多列、移动单列且动作满宽；所有链接至少 44px，范围说明为连续紧凑区域；不提供插槽时默认入口与范围说明保持原样 |
| `LsDashboardPath` | `title/description/steps` 必填；步骤为 `{key,label,description,to,icon}`，`to` 使用内部路由；无插槽；用有序导航连接真实业务步骤 | 表达进度、健康评分或完成率；调用方传入视觉参数或覆盖内部样式 | 宽屏横向排列，800px 以下纵向排列；链接至少 44px，键盘焦点可见，减少动态时取消过渡 |
| `LsListToolbar` | `modelValue=''`、`placeholder='搜索'`、`ariaLabel='搜索列表'`、`countLabel=''`、`searchable=true`；`filters/actions` 插槽分别承载筛选与主操作，`searchable=false` 时隐藏搜索但仍保留筛选、操作和可选结果数量 | 搜索图标放在输入外；数量漂移到列表外；把普通说明塞入筛选插槽；固定最小宽度挤出页面 | 搜索→筛选→动作→数量始终同一横向轨道，搜索不超过 28rem且允许收缩；单筛选自适应，多筛选局部滚动；移动控件高 44px；数量保留并使用 `aria-live=polite` |
| `LsMetricGrid` | `items=[{key,label,value,hint?}]` 必填，`ariaLabel` 默认“统计摘要”；承载同一范围内的一组只读指标 | 页面复制响应式指标网格、为每项单独套面板、调用方控制列数或视觉参数 | 默认三列，四项数据且视口不小于 1000px 时四列；800px 以下两列、480px 以下单列；数值使用等宽数字；标签、值和可选口径说明保持语义顺序，320px 与 200% 文本放大不溢出 |
| `LsFormList` | `v-model`、`itemKey`、`createItem` 必填；`itemLabel='项目'`、`addLabel='添加一项'`、`emptyText='尚未添加项目'`、`disabled=false`、`disabledReason`；`item` 插槽接收当前项目与索引 | 页面自行实现重复字段的增删排序；业务页面直接导入拖拽库；只提供拖拽而没有键盘替代路径；让行操作形成贯穿整项高度的侧栏并持续压缩业务字段 | 连续有边界列表；拖拽手柄、项目名称和行操作组成紧凑头部，`item` 内容在下一行占满名称至操作区的全部可用宽度；拖拽手柄支持指针与触控，上移/下移为完整键盘路径；增删排序后维持焦点并礼貌播报；行操作至少 44px；禁用命令保留键盘与点击解释，首尾移动说明由组件生成，业务锁定原因由调用方提供；移动端字段与操作自然换行；减少动态时取消排序动画 |
| `LsEntityIdentity` | `type/name/slug/imageUrl/fallback/size`；`status` 插槽只承载与当前主体直接相关的 `NTag`；真实头像优先，圆角方形回退 | 同一主体在列表和选择器使用圆形/不同信息结构；把主体状态推到列表行远端 | 类型、名称、slug 可辨；图片有替代文本；状态紧随名称且不挤压名称 |
| `LsEntityTag` | `type/name` 必填；`slug` 可选，`closable/disabled=false`；发出 `close` | 页面把 Entity 退化为逗号拼接的纯文本；复制选择器内部标签样式；用状态标签冒充具体 Entity | 类型图标、语义色文字和同色浅底始终可辨，未知类型回退为品牌蓝而非灰色；名称单行省略并保留完整标题；胶囊可用于选择器已选值和紧凑只读列表，关闭目标不挤压名称 |
| `LsEntityCard` | `entity` 必填；`clearable=false`、`clearLabel=''`、`chatEnabled=true`、`profileEnabled=true`；发出 `chat/profile/clear` | 自行复制主体卡片；无名称的纯图标清除动作 | 身份信息复用 `LsEntityIdentity`；清除按钮有可读标签；小屏动作换行但不隐藏语义 |
| `LsEntityInput` | `modelValue/query/recent/candidates` 默认空，`multiple=false`，可传 `searchEntities/inputId/placeholder`；发出模型、查询、聊天和简介事件 | 页面另写主体候选器；少于 2 个字符调用远端搜索 | 远端搜索防抖 220ms、最多 6 项；错误只在候选区域显示；键盘焦点和结果角色可识别 |
| `LsEntitySelect` | `modelValue/entities` 必填；`multiple/clearable/disabled/loading=false`，`placeholder="选择 Entity"`；发出 `update:modelValue` | 页面把 Entity 退化成纯名称下拉；自行复制类型、slug、图标或候选菜单样式；把候选的双层身份信息直接塞入已选标签 | 候选统一显示类型图标、名称、类型与 slug；名称、slug、类型和 ID 均可搜索；已选值只保留类型图标与单行名称，多选标签独立可删、长名称省略且不撑破容器 |
| `LsResponsiveActions` | `actions` 必填；`primaryKey=''`、`moreLabel='更多'`；动作含 `key/label/disabled/reason/danger/icon`，选择后发出 `select`；行内入口统一为透明、无边框的图标加文字 | 手机端混排纯图标和文字；危险操作成为主操作；用主色填充、浅色底或圆角胶囊把行内入口伪装成一组按钮；把禁用原因拼入菜单标签或 `title` | 权限态保留动作原标签并视觉降权，触发后仅由 `feedback.info()` 解释且不发出 `select`；危险项有文字；桌面显示完整动作；小于 640px 为一个主操作加菜单；触控区至少 44px；hover/focus 不改变布局边界 |
| `LsResponsiveDataTable` | `columns/data/rowKey` 必填，`scrollX` 可选；只用于至少三个页面共享同一“桌面表格、移动记录”需求，移动结构通过 `mobile-title/mobile-status/mobile` 插槽表达 | 单页提前包装、复制两份数据请求或同时挂载两份重复语义 DOM；为不同业务语义增加视觉参数 | 桌面直接使用 `NDataTable`；小于 720px 只挂载由同一 `data` 渲染的连续记录，避免隐藏副本造成重复辅助语义；页面无横向溢出；移动记录保留标题、状态和字段名 |
| `LsUploadField` | `modelValue=''`、`placeholder`、`buttonLabel='选择文件'`、`disabled/disabledReason/loading/progress/accept/multiple/showUrl`；可选 `trigger` 插槽只接收 `choose/disabled/disabledReason/loading`；发出模型、`choose/change`；默认内部命令必须复用 `LsButton` | 常驻“缺少能力”错误条；页面直接暴露原生文件输入；内部另用 `NButton` 形成第二套按钮；触发插槽重新实现文件选择 | 无能力时保持可解释权限态，点击只由 `feedback.info()` 说明且不发请求，不在字段下方或 `title` 重复原因；默认桌面上传命令在上传组件内固定 8.5rem；只有页面标题区可用 `trigger` 组合 `LsPagePrimaryAction`，文件输入和选择逻辑仍由上传组件持有；进度为区域状态；小于 640px 时纵向且按钮满宽 |
| `LsMediaUploadField` | `upload(file)` 必填；其余 URL、文件类型、按钮和禁用参数沿用 `LsUploadField`；自动回填单个文件 URL，并发出 `uploading/uploaded` | 页面重复解析文件事件、上传响应和错误；图片、视频字段只提供 URL 输入 | 选择文件后立即显示加载；失败在字段内可见；上传期间父表单可阻止保存；仍允许粘贴已登记 URL |
| `LsEmptyState` | `title`、`description` 为正常空数据文案；`source` 为未加工的查询结果，`accessReason` 为局部授权原因（可选）。默认继承当前路由的授权原因；有原因时统一显示受限空状态；用于页面主内容或主集合没有数据、筛选无结果 | 新增图标、动作、尺寸、样式或插槽参数；页面用裸图标、标题和段落重新拼装；把加载或错误交给本组件；按视口宽度放大垂直留白 | 固定使用 Naive `NEmpty`、白色有边界面板和居中排版；标准最小高度为 `12rem`（192px）、上下内边距固定 `2rem`，仅在文案换行或文本放大确实需要时自然增高；桌面与移动端自然换行且无横向溢出；组件测试锁定四个语义 props、普通空状态、受限空状态和紧凑高度 |
| `LsAsyncState` | `state=loading/error` 必填；`title/description` 可选、`rows=3`；只负责加载骨架和真实错误 | 承担空数据状态；手动“重试”按钮；同一错误同时全局提示；加载时空白 | 骨架数量稳定；错误使用区域 `alert` 且只出现一次；壳层和其他区域保持可用 |
| `LsRouteErrorBoundary` | 以路由地址为 `resetKey` 隔离异步路由渲染错误 | 让单页异常清空整个应用壳层 | 切换路由自动恢复；错误只占内容区 |
| `LsSearchInput` | `modelValue=''`、`placeholder='搜索'`、`ariaLabel='搜索'`、`autofocus=false`；搜索图标固定在输入内 | 页面手写图标+输入组合；显示选择器箭头 | 键盘、清除和焦点状态可用；输入类型为 search；桌面高度 40px、移动端 44px |
| `LsField` | `label/forId` 必填，`error/hint/required` 可选；包装单个表单控件 | 标签、错误和说明与控件脱离；只用占位符代替标签；调用方传入宽度或用提示高度调整相邻字段位置 | `forId` 必须指向控件；内部控件轨道固定满宽且从顶部开始排列，提示或错误增高字段时不得拉开标签与控件；并列字段的控件顶部与宽度保持一致；错误与说明不重复；必填状态可被辅助技术识别 |
| `LsCheckboxGroupField` | `v-model` 接受字符串或数字数组，`label/options` 必填；option 支持 `value/label/description/meta/disabled/disabledReason`；可传 `id/hint/error/required/disabled` | 页面直接组合无分组语义的 `NCheckboxGroup`；用于分组权限编辑器或动态加入字段；把禁用原因写进选项正文或 `title` | 固定 `fieldset/legend` 与提示/错误关联；带原因的禁用选项保持可触发的权限态，点击仅由 `feedback.info()` 解释且不更新模型；选项触控区至少 44px；长文案与移动端自然换行 |
| `LsSwitch` | `v-model` 接受布尔值；`disabled/readOnly/loading/disabledReason` 可选；是唯一 `NSwitch` 视觉原语，调用方通过普通无障碍属性命名 | 业务页面直接使用 `NSwitch`；轨道内显示状态文字；增加颜色、尺寸或文案视觉 props；把禁用原因写入原生标题 | 开关内部始终无文字；触控区域至少 44px；只读与禁用保留 `aria-disabled/aria-readonly` 语义；权限态的轨道与按钮内圈统一视觉降权，触发后仅由 `feedback.info()` 解释且不更新值；所有应用内紧凑布尔控件也必须复用 |
| `LsSwitchField` | `v-model` 接受布尔值，`label` 必填；`description/id/ariaLabel/headingLevel/disabled/readOnly/loading/disabledReason` 可选；内部只组合 `LsSwitch`，承载完整布尔设置行 | 在 `LsField`、`NFormItem` 或页面私有 `switch-row/switch-field` 中直接组合开关；在开关轨道内显示状态文字；把禁用原因写在设置行正文或 `title` | 默认以可见标签作为无障碍名称；设置页分区标题可用 `headingLevel`；固定、只读和可编辑状态保持同一结构；禁用原因只交给内部 `LsSwitch` 以信息弹窗解释；长文案和移动端不溢出 |
| `LsInput` | `v-model` 接受字符串或数字，`invalid/type` 可选；其余原生输入属性传给 `NInput.inputProps` | 页面直接写原生文本输入；用私有边框表示错误 | 密码类型保留；错误映射到 Naive `status=error` 和 `aria-invalid`；尺寸由主题控制 |
| `LsMarkdownEditor` | `modelValue` 与 `uploadImage(file)` 必填；可传 `placeholder/draftKey/searchEntities/resolveEntities/uploadDisabledReason`；模式固定为可视化/源码/预览 | 页面复制编辑器工具栏；省略上传回调导致图片入口消失；缺上传能力仍调用上传 | 图片入口始终存在；无权时以 `uploadDisabledReason` 保持可解释禁用；草稿键有值时本地保存；@ 搜索、上传和预览错误局部呈现 |
| `LsMarkdownRenderer` | `content`、`resolveEntities` 可选，`chatEnabled=true`；仅渲染清洗后的 Markdown 和受控 `lostsky://entity/` 引用 | 渲染任意未清洗 HTML；解析失败清空整页 | 解析失败退化为普通内容；主体详情可键盘关闭并恢复触发点焦点；移动端详情不溢出 |

新增 props、插槽、默认值或允许组合前必须先更新本表，组件测试覆盖默认、禁用、加载和移动端行为。

完整布尔设置行统一使用 `LsSwitchField`；动态设置渲染器、对象自定义布尔值编辑器和紧凑多开关组使用 `LsSwitch`。`NSwitch` 只允许出现在 `LsSwitch.vue`，不设业务页面白名单。业务页面不得重新定义 `switch-row` 或 `switch-field`。

普通、未分组的多选字段统一使用 `LsCheckboxGroupField`。Admin 分组权限编辑器和 Team 动态加入字段需要业务分组或运行时控件分派，可直接使用 `NCheckboxGroup`；允许文件由源码契约精确锁定，不得扩散。

普通页面的创建、保存、取消、删除、确认等命令必须使用 `LsButton`；页面标题区唯一主操作必须使用 `LsPagePrimaryAction`。直接 `NButton` 只允许用于应用壳层导航、Admin 平台命令搜索结果和确实没有可见文案的 44×44px 微操作；新增例外必须先在应用规则登记，并同步源码契约白名单。导航链接继续使用 `RouterLink` 或安全的 `<a>`，不得为了复用按钮外观把链接伪装成提交命令。

## 封闭契约补充

- `LsEmptyState` 的标题和下一步说明均使用 `--text-secondary`，不得继承 `NEmpty` 的禁用文字色；无数据不代表文字不可用。由组件内部固定主题映射，调用方不传颜色。通过真实页面计算样式验证两者一致，并遵循正文 4.5:1 的对比度要求。

- `LsPagePrimaryAction` 的等宽只属于“页面标题区唯一主操作”这一项完整语义，不是全局按钮令牌。`LsFormActions` 负责表单命令组的排列：桌面端内容自适应、最小 7rem，小于 640px 双动作两列、各自填满列宽；`LsFormList` 的添加命令同样内容自适应、最小 7rem；`LsUploadField` 的默认上传命令固定 8.5rem。其他不同任务不得为了视觉齐边共享宽度，调用方也不得传递宽度、断点或视觉变体。
- `LsPage.width` 是页面根容器的语义容量（`wide/content/form`），不是任意子控件的视觉微调入口；页面需要不同的内容容量时选用该枚举，不新增自由宽度参数。
- `LsResponsiveDataTable.scrollX` 表示桌面数据列所需的最小可读容量，只能由列内容推导；它不是页面为对齐或留白而传递的视觉宽度参数。
- `LsMarkdownRenderer.context` 仅表达 `inline/document` 两种阅读语境，并由组件内部调整排版令牌；调用方不得穿透 Markdown 生成节点来改标题、字号、行高或间距。

## 实现级例外

例外只能解决浏览器或第三方编辑器的实现边界，不能改变用户可见的设计语言：

- `LsUploadField` 内部保留一个 `display:none` 的原生 `input[type=file]`。适用范围仅为该公共组件，因为浏览器安全模型要求由文件输入取得本地文件；页面不得直接引用或设计它。桌面和移动端都由 44px 以上的 `NButton` 触发；存在禁用原因时按钮以 `aria-disabled` 保留可触发说明的语义，点击或键盘触发只显示短时全局提示，不点击隐藏输入、不发请求。检查方法：源码扫描中只允许 `LsUploadField.vue` 出现这一原生文件输入，并用组件测试断言 disabled 不触发 `change/choose` 后续请求。
- 单文件资料字段默认使用 `LsMediaUploadField`，由组件处理文件选择、上传状态、URL 回填和局部错误。只有文件库的多文件/进度上传、加入申请的专用上传流程可以直接组合 `LsUploadField`；页面不得为头像、封面、介绍图片或视频重新实现一套上传事件。
- `LsMarkdownRenderer` 的清洗结果内允许生成主体引用 `button`。适用范围仅为 DOMPurify 清洗后的 `lostsky://entity/` 引用，因为字符串渲染结果不能直接挂载 Vue/Naive 组件；它必须使用公共按钮令牌、提供主体名称、键盘触发与焦点恢复，不得生成其他原生控件。解析、权限或主体解析失败时退化为普通安全文本，不弹全局错误。检查方法：源码允许清单只包含该生成语句，并测试清洗、键盘和关闭后焦点。
- Milkdown/Crepe 可管理其编辑区内部语义和必要工具栏 DOM。适用范围仅为 `LsMarkdownEditor` 的第三方编辑区；LostSky 仍负责外层模式、搜索、上传、错误、尺寸、焦点和减少动态效果，不得复制一套页面级编辑器控件。检查方法：组件测试三个模式和禁用上传，静态检查禁止其他页面直接引入 Crepe。
- `LsFormList` 内部使用 `vue-draggable-plus` 同步单列表拖拽排序。适用范围仅为该公共组件；业务页面只能使用 `v-model`、项目工厂和项目插槽，不得直接导入拖拽库或依赖其事件结构。拖拽是指针与触控增强，上移/下移按钮始终提供等价键盘路径；组件卸载时由 Vue 封装销毁实例。检查方法：静态测试只允许 `LsFormList.vue` 导入 `vue-draggable-plus`，组件与 E2E 分别覆盖按钮和拖拽排序。
