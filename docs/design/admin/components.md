# 后台公共组件

## 组件体系边界

后台唯一组件体系是 `Naive UI 2.44.1 + @lostsky/ui`。标准输入、选择、按钮、标签、分页、弹层、提示和日期控件必须使用 Naive UI；业务语义组件放入 `@lostsky/ui`。禁止引入 PrimeVue，禁止复制 shadcn-vue 组件，禁止用原生元素和页面私有 CSS 重造已有控件。

所有后台应用根节点必须注入 `NConfigProvider`、`zhCN`、LostSky 主题和 Lucide 1.8 描边；需要消息或对话框的应用在根部注入 Provider。页面不得再次创建主题 Provider。

## 组件契约

| 组件 | 必须用途与参数 | 禁止组合 | 状态与响应式检查 |
| --- | --- | --- | --- |
| `LsButton` | `variant=primary/secondary/ghost/danger`、`size=sm/md/lg`、`loading`、`disabled`、`type=button/submit/reset`；`icon` 插槽承载命令图标；是 `NButton` 薄适配层 | 页面私有按钮皮肤、同组混合尺寸、在默认插槽中反复手排图标间距 | loading 保留尺寸；disabled 有原生语义；40/44/48px；图标不改变可读文案 |
| `LsInlineError` | 只接收必填 `message`；用于字段组、表单或局部操作的阻断错误 | 自定义颜色、图标、标题、动作、插槽或重复书写 `role=alert` | 固定区域 `alert`、危险色和紧凑内边距；长文案与 200% 文本自然换行；空状态和页面加载错误不得使用 |
| `LsPanel` | 无 props；`header/default/footer` 三个插槽承载有边界的独立内容区 | 视觉变体、页面级 `.panel` 皮肤、嵌套面板、为连续列表逐项套面板 | 桌面 20px、移动端 16px 内边距；插槽边界使用细分隔线；加载、空、错误由内容区对应状态组件表达 |
| `LsStatusTag` | `label` 必填，`type=default/success/warning/error/info`；统一状态标签 | 调用端重复 `size=small`、`bordered=false`，或按页面自建 StatusBadge | 固定 small、无边框；颜色不能替代文案；移动端和文本放大时不裁切状态文案 |
| `LsPage` | `as=main/section/div`（默认 `section`）、`width=wide/content/form`（默认 `wide`）、`id`；分别用于列表、详情、单列表单 | 页面再嵌套同类容器 | 320px 无横向溢出，桌面居中；页面只能有一个 `main` |
| `LsPageHeader` | `title` 必填；`description`、`backTo`、`backLabel` 可选；`actions` 插槽只承载当前区域动作 | 页面自行复制标题栏；移动端堆叠孤立图标 | 标题层级唯一；返回区 44px；动作小屏单列；无返回目标时不渲染返回入口 |
| `LsWorkspaceHeader` | `contextLabel/title` 必填，`actions=[]`、`showMenu=true`；`actions` 插槽用于桌面图标加文字，`action` 事件承接移动菜单，`menu` 事件打开导航 | 移动端保留一排无文字图标；页面自行实现第二套顶栏；把响应式类直接传给无根 `NDropdown` | 桌面图标+文字且统一为 `--font-ui`、14px/600；移动端只显示带文字“操作”菜单；禁用原因随菜单项保留；顶栏结构稳定 |
| `LsListToolbar` | `modelValue=''`、`placeholder='搜索'`、`ariaLabel='搜索列表'`、`countLabel=''`；`filters/actions` 插槽分别承载筛选与主操作 | 搜索图标放在输入外；数量漂移到列表外；把普通说明塞入筛选插槽；让 `NSelect` 在无确定宽度的容器中折叠 | 桌面搜索→筛选→动作→数量，搜索不超过 28rem、筛选通常为 10rem、控件高 40px；移动端纵向且控件高 44px；数量使用 `aria-live=polite` |
| `LsEntityIdentity` | `type/name/slug/imageUrl/fallback/size`；`status` 插槽只承载与当前主体直接相关的 `NTag`；真实头像优先，圆角方形回退 | 同一主体在列表和选择器使用圆形/不同信息结构；把主体状态推到列表行远端 | 类型、名称、slug 可辨；图片有替代文本；状态紧随名称且不挤压名称 |
| `LsEntityCard` | `entity` 必填；`clearable=false`、`clearLabel=''`、`chatEnabled=true`、`profileEnabled=true`；发出 `chat/profile/clear` | 自行复制主体卡片；无名称的纯图标清除动作 | 身份信息复用 `LsEntityIdentity`；清除按钮有可读标签；小屏动作换行但不隐藏语义 |
| `LsEntityInput` | `modelValue/query/recent/candidates` 默认空，`multiple=false`，可传 `searchEntities/inputId/placeholder`；发出模型、查询、聊天和简介事件 | 页面另写主体候选器；少于 2 个字符调用远端搜索 | 远端搜索防抖 220ms、最多 6 项；错误只在候选区域显示；键盘焦点和结果角色可识别 |
| `LsResponsiveActions` | `actions` 必填；`primaryKey=''`、`moreLabel='更多'`；动作含 `key/label/disabled/reason/danger/icon`，选择后发出 `select`；行内入口统一为透明、无边框的图标加文字 | 手机端混排纯图标和文字；危险操作成为主操作；用主色填充、浅色底或圆角胶囊把行内入口伪装成一组按钮 | 禁用原因保留；危险项有文字；桌面显示完整动作；小于 640px 为一个主操作加菜单；触控区至少 44px；hover/focus 不改变布局边界 |
| `LsResponsiveDataTable` | `columns/data/rowKey` 必填，`scrollX` 可选；只用于至少三个页面共享同一“桌面表格、移动记录”需求，移动结构通过 `mobile-title/mobile-status/mobile` 插槽表达 | 单页提前包装、复制两份数据请求或同时挂载两份重复语义 DOM；为不同业务语义增加视觉参数 | 桌面直接使用 `NDataTable`；小于 720px 只挂载由同一 `data` 渲染的连续记录，避免隐藏副本造成重复辅助语义；页面无横向溢出；移动记录保留标题、状态和字段名 |
| `LsUploadField` | `modelValue=''`、`placeholder`、`buttonLabel='选择文件'`、`disabled/loading/progress/accept/multiple/showUrl/showReason`；发出模型、`choose/change` | 常驻“缺少能力”错误条；大号上传按钮；页面直接暴露原生文件输入 | 无能力时稳定禁用且不发请求；进度为区域状态；移动端纵向；禁用原因进入标题和可选说明 |
| `LsEmptyState` | 只允许两个必填参数：`title` 为上方无数据文案，`description` 为下方提示文案；用于页面主内容或主集合没有数据、筛选无结果 | 新增图标、动作、尺寸、样式或插槽参数；页面用裸图标、标题和段落重新拼装；把加载或错误交给本组件；按视口宽度放大垂直留白 | 固定使用 Naive `NEmpty`、白色有边界面板和居中排版；标准最小高度为 `12rem`（192px）、上下内边距固定 `2rem`，仅在文案换行或文本放大确实需要时自然增高；桌面与移动端自然换行且无横向溢出；组件测试锁定仅有两个 props 和紧凑高度 |
| `LsAsyncState` | `state=loading/error` 必填；`title/description` 可选、`rows=3`；只负责加载骨架和真实错误 | 承担空数据状态；手动“重试”按钮；同一错误同时全局提示；加载时空白 | 骨架数量稳定；错误使用区域 `alert` 且只出现一次；壳层和其他区域保持可用 |
| `LsRouteErrorBoundary` | 以路由地址为 `resetKey` 隔离异步路由渲染错误 | 让单页异常清空整个应用壳层 | 切换路由自动恢复；错误只占内容区 |
| `LsSearchInput` | `modelValue=''`、`placeholder='搜索'`、`ariaLabel='搜索'`、`autofocus=false`；搜索图标固定在输入内 | 页面手写图标+输入组合；显示选择器箭头 | 键盘、清除和焦点状态可用；输入类型为 search；桌面高度 40px、移动端 44px |
| `LsField` | `label/forId` 必填，`error/hint/required` 可选；包装单个表单控件 | 标签、错误和说明与控件脱离；只用占位符代替标签 | `forId` 必须指向控件；错误与说明不重复；必填状态可被辅助技术识别 |
| `LsInput` | `v-model` 接受字符串或数字，`invalid/type` 可选；其余原生输入属性传给 `NInput.inputProps` | 页面直接写原生文本输入；用私有边框表示错误 | 密码类型保留；错误映射到 Naive `status=error` 和 `aria-invalid`；尺寸由主题控制 |
| `LsMarkdownEditor` | `modelValue` 必填；可传 `placeholder/draftKey/searchEntities/resolveEntities/uploadImage/uploadDisabledReason`；模式固定为可视化/源码/预览 | 页面复制编辑器工具栏；缺上传能力仍调用上传 | 外层模式、搜索与操作使用 Naive UI；草稿键有值时本地保存；@ 搜索、上传和预览错误局部呈现；减少动态时关闭非必要过渡 |
| `LsMarkdownRenderer` | `content`、`resolveEntities` 可选，`chatEnabled=true`；仅渲染清洗后的 Markdown 和受控 `lostsky://entity/` 引用 | 渲染任意未清洗 HTML；解析失败清空整页 | 解析失败退化为普通内容；主体详情可键盘关闭并恢复触发点焦点；移动端详情不溢出 |

新增 props、插槽、默认值或允许组合前必须先更新本表，组件测试覆盖默认、禁用、加载和移动端行为。

页面的创建、保存、取消、删除、确认等命令必须使用 `LsButton`。直接 `NButton` 只允许用于应用壳层导航、Admin 平台命令搜索结果和确实没有可见文案的 44×44px 微操作；新增例外必须先在应用规则登记，并同步源码契约白名单。导航链接继续使用 `RouterLink` 或安全的 `<a>`，不得为了复用按钮外观把链接伪装成提交命令。

## 实现级例外

例外只能解决浏览器或第三方编辑器的实现边界，不能改变用户可见的设计语言：

- `LsUploadField` 内部保留一个 `display:none` 的原生 `input[type=file]`。适用范围仅为该公共组件，因为浏览器安全模型要求由文件输入取得本地文件；页面不得直接引用或设计它。桌面和移动端都由 44px 以上的 `NButton` 触发，禁用时不点击隐藏输入、不发请求，进度和错误仍由公共组件表达。检查方法：源码扫描中只允许 `LsUploadField.vue` 出现这一原生文件输入，并用组件测试断言 disabled 不触发 `change/choose` 后续请求。
- `LsMarkdownRenderer` 的清洗结果内允许生成主体引用 `button`。适用范围仅为 DOMPurify 清洗后的 `lostsky://entity/` 引用，因为字符串渲染结果不能直接挂载 Vue/Naive 组件；它必须使用公共按钮令牌、提供主体名称、键盘触发与焦点恢复，不得生成其他原生控件。解析、权限或主体解析失败时退化为普通安全文本，不弹全局错误。检查方法：源码允许清单只包含该生成语句，并测试清洗、键盘和关闭后焦点。
- Milkdown/Crepe 可管理其编辑区内部语义和必要工具栏 DOM。适用范围仅为 `LsMarkdownEditor` 的第三方编辑区；LostSky 仍负责外层模式、搜索、上传、错误、尺寸、焦点和减少动态效果，不得复制一套页面级编辑器控件。检查方法：组件测试三个模式和禁用上传，静态检查禁止其他页面直接引入 Crepe。
