# 前端约定

## 开始前

- 阅读对应 [OpenAPI](../openapi/README.md)、[产品定义](../product.md)和[设计系统](../design.md)。
- 使用 `karpathy-guidelines` 控制范围，`impeccable` 负责设计，`ui-ux-pro-max` 只做专项检查；不得使用 `lostsky-frontend`。

## 实现

- 标准控件使用 Naive UI 和 `frontend/packages/ui/src/naive-theme.ts`。
- API、鉴权与错误归入 `@lostsky/api`；通用 UI 归入 `@lostsky/ui`；导航与无界面工具归入 `@lostsky/shared`。
- 列表搜索与筛选优先复用 `LsSearchInput.vue` 和 `LsListToolbar.vue`，同一对象的选择搜索应展示名称、Slug、类型和全局标识，不退化为要求精确输入 Slug 的普通文本框。
- 保存、删除、权限/能力原因等短时操作反馈统一通过 `@lostsky/ui/feedback`；默认自动消失并抑制短时间重复消息。字段校验和可恢复的加载错误仍靠近问题展示，不以全局提示替代。
- 请求通过 `@lostsky/api/client`，登录回跳使用 `@lostsky/shared/navigation`。
- 能使用 Markdown 的地方都使用 Markdown。编辑端统一使用 `LsMarkdownEditor.vue`，展示端统一使用 `LsMarkdownRenderer.vue`、`marked` 和 DOMPurify；列表等紧凑场景只显示去除语法后的纯文本摘要，新增来源时同步后端引用与清理。
- 枚举表单复用同一组选项，并通过 `enumOptionValue()` 兼容回填值。
- 团队后台使用 `AdminPage.vue` 与 `AdminPageHeader.vue`；查看、创建、编辑和审核使用独立路由。
- 交互覆盖键盘、触控、加载、空、错误、禁用和 `prefers-reduced-motion`。
- 后台动效复用 `@lostsky/ui/styles.css` 的 `--motion-*`、`--ease-*` 和 `ls-state`、`ls-popover`、`ls-list`、`ls-backdrop` 过渡；只动画 `transform`、`opacity` 与必要的颜色/边框，不为列表首次渲染添加 `appear`，不在页面内另造时长与缓动。
- 一律使用`//`,不使用`http://`,`https://`

本条域名约定不适用于开发代理配置：Vite 本地代理默认使用 `http://api.lostsky.work`，避免本地证书或静态站点兜底响应被误判为 CORS；需要覆盖时使用 `VITE_DEV_API_TARGET`。

## 交付

修改前端源码、生成类型或构建配置后运行 `npm run build`，同步提交源码与 `www/`；禁止手改 `www/` 和 `frontend/packages/api/src/generated/`。
