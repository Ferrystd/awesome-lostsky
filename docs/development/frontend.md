# 前端约定

## 开始前

- 阅读对应 [OpenAPI](../openapi/README.md)、[产品定义](../product.md)和[设计系统](../design.md)。
- 后台改动必须继续阅读[后台设计规范](../design/admin/index.md)、对应应用条目和[完成定义](../design/admin/checklist.md)。任何未来仍需遵守、复用、解释或验收的规则，无论跨应用、单应用或单页面，都必须先更新 Wiki；组件默认值、代码、测试和口头约定不能替代规范正文。
- 新增或修改后台页面结构前，必须按[后台页面组件化方法](../design/admin/componentization.md)搜索现有实现并在 commentary 给出组件化盘点；达到阈值时在同一变更中提取组件、迁移全部同义用法并删除旧 CSS。
- 使用 `karpathy-guidelines` 控制范围，`impeccable` 负责设计，`ui-ux-pro-max` 只做专项检查；不得使用 `lostsky-frontend`。

## 实现

- 标准控件只使用 Naive UI 2.44.1 和 `@lostsky/ui`；不得引入 PrimeVue 或复制 shadcn-vue 组件。完整边界见[公共组件](../design/admin/components.md)。
- 普通后台布尔设置使用 `LsSwitchField`，不得在 `LsField`、`NFormItem` 或页面私有开关行中直接组合 `NSwitch`；动态设置、对象布尔值和紧凑多开关组仅按公共组件 Wiki 的固定例外使用。
- API、鉴权与错误归入 `@lostsky/api`；通用 UI 归入 `@lostsky/ui`；导航与无界面工具归入 `@lostsky/shared`。
- 跨应用报错文案统一维护在 `@lostsky/api/error-messages`。网络、超时、限流、服务异常和未知错误直接修改 `ERROR_MESSAGES`；Permission、Ability 与 TeamSetting 入口条件使用默认模板和按键覆盖表，不得在页面重复拼接同类文案。工作台卡片、导航、按钮的 `reason`、`title`、无障碍说明和短时反馈也属于错误文案：缺少 Permission 必须调用 `formatPermissionDenied()`，缺少 Ability 必须调用 `formatAbilityDenied()`，访问快照请求失败必须调用 `friendlyError()`；页面只可自行描述“正在核对”等非错误加载状态。Permission 模板可使用 `{permission}`、`{permissions}`，Ability 模板可使用 `{key}`、`{keyTitle}`、`{label}`；TeamSetting 覆盖键使用 `app_name.key`，模板可使用 `{app}`、`{key}`、`{setting}`、`{label}`、`{required}`、`{current}`。TeamSetting 条件支持指定值以及包含边界的最小值、最大值或闭区间，条件满足时不生成禁用原因。
- 列表搜索与筛选优先复用 `LsSearchInput.vue` 和 `LsListToolbar.vue`，同一对象的选择搜索应展示名称、Slug、类型和全局标识，不退化为要求精确输入 Slug 的普通文本框。
- 保存、删除、权限/能力原因等短时操作反馈统一通过 `@lostsky/ui/feedback`；默认自动消失并抑制短时间重复消息。字段校验和可恢复的加载错误仍靠近问题展示，不以全局提示替代。
- 请求通过 `@lostsky/api/client`，登录回跳使用 `@lostsky/shared/navigation`。
- 能使用 Markdown 的地方都使用 Markdown。编辑端统一使用 `LsMarkdownEditor.vue`，且必须提供真实 `uploadImage(file)` 回调；无权限时传入可解释的 `uploadDisabledReason`，不得省略回调或退化为 textarea。展示端统一使用 `LsMarkdownRenderer.vue`、`marked` 和 DOMPurify；列表等紧凑场景只显示去除语法后的纯文本摘要，新增来源时同步后端引用与清理。
- 头像、封面、介绍图片、介绍视频等单文件资料字段统一使用 `LsMediaUploadField.vue`；共享 API 的 `uploadFileUrl` 负责解释上传结果。页面只负责权限原因和保存，不得只保留 URL 输入框，也不得重复读取原生文件事件。
- 枚举表单复用同一组选项，并通过 `enumOptionValue()` 兼容回填值。
- 后台页面使用 `LsPage`、`LsPageHeader`、`LsWorkspaceHeader` 等公共组件；Team 的历史适配组件只允许做无样式薄包装。查看、创建、编辑和审核使用独立路由。
- 页面只负责路由、数据、权限、业务编排和组件间布局；组件负责内部视觉、间距、交互状态、响应式和无障碍。不得为假设场景制造 props、万能 Schema 渲染器或单次公共组件。
- 交互覆盖键盘、触控、加载、空、错误、禁用和 `prefers-reduced-motion`。
- 已登记组件的讨论、修改与验收必须按[组件代码预览](component-previews.md)从真实 Vue 代码生成状态矩阵；PNG 只供人类查看，Agent 不得读图或据其修改界面，也不得使用 AI 生成图片替代。
- 后台动效复用 `@lostsky/ui/styles.css` 的 `--motion-*`、`--ease-*` 和 `ls-state`、`ls-popover`、`ls-list`、`ls-backdrop` 过渡；只动画 `transform`、`opacity` 与必要的颜色/边框，不为列表首次渲染添加 `appear`，不在页面内另造时长与缓动。
- 一律使用`//`,不使用`http://`,`https://`

本条域名约定不适用于开发代理配置：Vite 本地代理默认使用 `http://api.lostsky.work`，避免本地证书或静态站点兜底响应被误判为 CORS；需要覆盖时使用 `VITE_DEV_API_TARGET`。

## 交付

修改前端源码、生成类型或构建配置后运行 `npm run build`，同步提交源码与 `www/`；禁止手改 `www/` 和 `frontend/packages/api/src/generated/`。
