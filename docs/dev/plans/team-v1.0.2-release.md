# v1.0.2 发布范围

本版以 v1.0.0 为基线，纳入其后已完成的非 Community 功能。新版页面风格只覆盖 Team；其他应用的新版极光、模板、面板与排版迁移留在原开发分支。新增功能入口和必要的移动导航可用性修复仍包含在本版。

## 功能来源与接入

| 功能 | 来源提交 | 接入路径 | 验证 |
| --- | --- | --- | --- |
| Team 新版页面与极光模板 | 3397e3ae、4c5a1132、d4b8078e、94732e49、0e58c30c、cdca1533 | frontend/apps/team；排除 CommunitiesView 与社区路由 | Team 类型检查、完整静态构建、前期已审阅页面 |
| 手机号验证恢复密码与换绑 | 7318f171 | Account Recovery/Login/SmsCodeField、recovery API、后端恢复服务 | account_recovery.php、account-recovery.spec.ts |
| 人员字段已保存值列表 | 904e1480、3397e3ae | Team EntityFieldFormView、TeamEntityField、OpenAPI 与生成类型 | entity_field_values.php、entity-field-values.test.ts、entity-field-values.spec.ts |
| 顾客入口按身份收口 | f31ee247 | ChatView、shared/navigation | 类型检查、定向源码契约核验；社区入口排除 |
| 移动应用切换 | d3efca34 | LsAppSwitcher、LsWorkspaceHeader、Chat/Shop/Transaction/Weibo shell | 类型检查及构建；不包含非 Team 表单排版调整 |
| 平台兑换活动入口和窄屏导航修复 | 8d95640e | AdminShell、EntitlementCampaignsView、EntitlementPackagesView、Admin/Shop app.css | 类型检查及构建 |
| 兑换活动路由精确匹配、Team 文档路由修复 | a36a6305、148251ef | Admin/Team route | PHP 定向路由检查 |
| Markdown 通用文件引用恢复 | 1b4dcd5e 非社区 hunk | Markdown.php 的 reference 恢复 | Markdown 定向检查 |

## 隔离与保留

Team UI 隔离目录 `frontend/apps/team/src/ui` 来源为 main 3397e3ae 的公共 UI，只由 Team Vite alias 使用；不包含 Community 组件。这是发布隔离层，并非另一套设计系统，未来其他应用正式迁移时应恢复公共引用。

明确排除 Community 前端、后端、模型、路由、SQL、权限、OpenAPI、全局入口及 Team 社区页面；不包含其他应用的未发布视觉迁移。保留 Account 恢复功能的新页面以及必要移动导航交互，不引入其他应用极光或模板布局。

其他应用视觉成果保留于原分支；本次不删除工作区，不修改开发保全分支。没有本版新增数据库迁移。构建产物 www/ 不纳入 Git。

## 验证记录

具体命令、退出码和日志由本次最终发布验收记录汇总。先前纯 Team 样式构建不替代本版新增功能验证。

### 前端定向验证（本版源码）

- `npx vitest run frontend/apps/team/src/entity-field-values.test.ts`：2 项通过（0/false 与值渲染）。
- `npx playwright test tests/account-recovery.spec.ts tests/entity-field-values.spec.ts --config playwright.team-release.config.ts --project desktop-chromium --workers 1`：覆盖恢复密码、换绑、凭据有效期/刷新、短信契约与字段值分页/受限/空态/长值；17 项中 16 项首轮通过。
- 单例 `-g 'expired credential and reload'`：首轮导航等待超时后独立重跑通过（1 项），未重复整个用例组。
- `npx vue-tsc --noEmit -p frontend/tsconfig.team-release.json` 与 `frontend/tsconfig.release-apps.json` 均通过。
- `npm run generate:api` 完成，生成差异仅 account.ts、team.ts，其余 API 类型与基线一致。

### 后端定向验证（Sol 交接）

- 账号恢复：55 断言；并发恢复：12 断言；人员字段值：33 断言。
- Team 文档真实 dispatch：5 断言；Admin 路由真实 dispatch、OpenAPI 路由检查、系统日志检查通过。
- Markdown 通用引用恢复：修复软删除记录恢复路径并通过 18 个回滚断言，覆盖文档/资料/商品引用；不包含社区引用源。
- 20 个 PHP 文件语法检查通过。涉及数据库的检查仅在本地 debug 回环数据库运行，无 schema 变更。

### 非 Team 样式边界证据

- 公共 `LsInput.vue` 相对 v1.0.0 仅新增 disabled 属性及透传，原材质/CSS 原样保留（7318f171）。
- 公共 `LsWorkspaceHeader.vue` 仅新增移动应用切换组件和 currentApp 属性；桌面五入口 472px/5×88px 及其余 CSS 保持 v1，未带入 Community 六入口宽度或 contextual/极光样式。
- Admin `app.css` 只将桌面侧栏断点从 960px 调至 768px，解决平板无菜单；Shop `app.css` 只增加窄屏导航换行与 max-width（8d95640e）。
- 其他应用不引入 scene、目录/档案/表单新模板或全局材质；Account 新恢复页、移动应用弹出选择器为新增功能 UI。

### 发布构建

- 完整 `npm run build` 已完成 9 个应用和 CORS 契约检查；Community 不在构建列表。
- `npm run build:docs` 已通过开发文档和用户指南构建；人工手册正文未修改。
- `composer check-platform-reqs --no-dev` 通过，`git diff --check` 通过。
- 最终公共 Header 恢复 v1 五入口宽度后，受影响范围仅 Admin/Transaction/Shop/Weibo，串行重建这四个应用并更新本工作区 www；其余五个应用复用同轮完整构建。
- 日志位于工作区同级 `release-1.0.2-*.log`。以上是本地源码与静态产物验证，不是生产部署验收。

### main 手册保留说明

main 的正式版本提交保留了 `docs/user/dictionary/permissions.md` 的原人工维护内容，因此最终 main 树与发布准备提交 `7d4bb318` 的差异还包括该手册及本说明；手册中的 Community 权限文字不代表本版交付 Community 功能，Community 应用代码、路由与 schema 均已排除。
