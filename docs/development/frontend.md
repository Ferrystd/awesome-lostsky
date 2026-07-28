# 前端约定

## 开始前

- 阅读对应 [OpenAPI](../openapi/README.md)、[产品定义](../product.md)和[设计系统](../design.md)。
- 使用 `karpathy-guidelines` 控制范围，`impeccable` 负责设计，`ui-ux-pro-max` 只做专项检查；不得使用 `lostsky-frontend`。

## 实现

- 标准控件使用 Naive UI 和 `frontend/packages/ui/src/naive-theme.ts`。
- API、鉴权与错误归入 `@lostsky/api`；通用 UI 归入 `@lostsky/ui`；导航与无界面工具归入 `@lostsky/shared`。
- 请求通过 `@lostsky/api/client`，登录回跳使用 `@lostsky/shared/navigation`。
- Markdown 使用 `LsMarkdownRenderer.vue`、`marked` 和 DOMPurify；新增来源时同步后端引用与清理。
- 枚举表单复用同一组选项，并通过 `enumOptionValue()` 兼容回填值。
- 团队后台使用 `AdminPage.vue` 与 `AdminPageHeader.vue`；查看、创建、编辑和审核使用独立路由。
- 交互覆盖键盘、触控、加载、空、错误、禁用和 `prefers-reduced-motion`。

## 交付

修改前端源码、生成类型或构建配置后运行 `npm run build`，同步提交源码与 `www/`；禁止手改 `www/` 和 `frontend/packages/api/src/generated/`。
