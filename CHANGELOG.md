# Changelog

## v0.0.15 (2026-07-03)

### 新增

- 新增全局 CORS 中间件和配置文件，支持 `OPTIONS` 预检请求。
- 补全运行时依赖：`topthink/think-multi-app` 和 `firebase/php-jwt`。
- 新增前端静态站点 Nginx 伪静态示例。

### 变更

- CORS 默认开放为 `Access-Control-Allow-Origin: *`，并关闭 credentials。
- README 精简为部署步骤、PATH 配置、伪静态、注意事项和检查命令。
- `.env.example` 注释改为更稳妥的 env 解析格式。

### 修复

- 修复未安装多应用扩展导致应用路由不加载、接口 404 的问题。
- 修复缺少 JWT 依赖导致 `Class "Firebase\JWT\JWT" not found` 的问题。
- 修复域名 env 键名未被 ThinkPHP 读取、AppResolver 未能早于 MultiApp 生效导致 `/team/index` 404/CORS 表象的问题。

## v0.0.14 (2026-07-03)

### 新增

- **成员详情页**：新增 `www/team.lostsky.work/member-detail.html`（含配套 `page-member-detail.css` / `page-member-detail.js`），支持查看和编辑成员完整资料与自定义字段值。
- **Nginx 静态通配模板**：新增 `deploy/nginx/lostsky-static-wildcard.conf`，统一管理 `{app}.lostsky.work` 与 `{slug}.{app}.lostsky.work` 的静态资源路由。

### 变更

- **成员管理页增强**（`members.html`）：
  - 新增成员「介绍图 / 介绍视频 / Markdown 详细介绍」表单字段
  - 新增岗位分配复选框，支持在编辑成员时分配岗位
  - 表格操作列新增「详情」链接，跳转至成员详情页
  - 页面加载时并行请求成员列表与岗位列表
- **团队样式**（`page-team.css`）：新增开关组件等样式，适配成员详情页
- **岗位类型页**（`fields.html`）、**设置页**（`settings.html`）：微调

## v0.0.13 (2026-07-02)

### 新增

- **团队选择页**：新增 `www/account.lostsky.work/teams.html`（含配套 CSS/JS），用户登录后可选择要进入的团队空间。
- **前端认证体系重构**：`www/assets.lostsky.work/js/api.js` 大幅增强：
  - Cookie + localStorage 双层 Token 持久化，支持跨子域名（`.lostsky.work`）共享
  - 页面级自动认证检测（`ensureAuthenticatedPage`），未登录自动跳转登录页
  - 公开页面/API 白名单机制，`account` 登录/注册页、`www` 首页免鉴权
  - 401 响应智能识别（状态码 + 业务码 + 消息关键字），过期自动重定向
  - `saveAuth`/`clearAuth`/`getAuthUser` 统一认证工具方法

### 变更

- **注册响应标准化**：`Register` 控制器改用 `success()` 包装，与 v0.0.12 登录标准化对齐。
- **AppResolver 精简**：移除 `admin` 路由绑定逻辑，仅保留 `{app}.lostsky.work` 无 slug 子域名解析。
- **默认应用调整**：`config/app.php` 中 `default_app` 从 `admin` 改为 `account`，`teamless_apps` 移除 `admin`。
- **管理后台认证守卫**：全部 7 个管理页面集成 `api.js` 的自动认证检测，无需各页面单独处理。
- **登录/注册页**：样式及脚本微调，适配新认证体系。

## v0.0.12 (2026-07-02)

### 修复

- **登录/注册响应标准化**：`Login` 控制器 `phone`/`password` 方法改用 `success()` 包装，返回标准信封 `{code, message, data}` 而非裸 JSON。前端 `api.js` 可正常解包。
- **AppResolver 扩展**：新增无 slug 单级子域名 `{app}.lostsky.work` 的 Origin 解析支持，修复 `account.lostsky.work` 被错误解析为 `admin` 应用的问题。
- **account 加入 teamless_apps**：`config/app.php` 中 `teamless_apps` 新增 `account`，account 应用无需团队上下文即可运行。

## v0.0.11 (2026-07-02)

### 新增

- **管理后台前端**：新增 `www/team.lostsky.work/` 7 个管理页面，基于 Tailwind CSS 构建：
  - 仪表盘（`index.html`）：团队概览，成员/岗位/字段/空间统计
  - 成员管理（`members.html`）：成员列表、添加/编辑/封禁/移出操作
  - 我的资料（`me.html`）：个人资料查看与编辑
  - 岗位类型（`posts.html`）：岗位类型 CRUD 管理
  - 自定义字段（`fields.html`）：成员扩展字段定义与管理
  - 文件库（`files.html`）：团队文件浏览、搜索、分页
  - 团队设置（`settings.html`）：团队基础配置表单
- **官网落地页**：新增 `www/www.lostsky.work/` 主站页面。
- **账号认证页面**：新增 `www/account.lostsky.work/` 登录/注册页面。
- **共享前端资源**：新增 `www/assets.lostsky.work/js/api.js`（API 请求封装，JWT 鉴权、响应解包、错误处理）和 Tailwind 配置。
- **前端 Skill**：新增 `lostsky-frontend` Agent Skill，规范前端页面搭建流程。
- **E2E 测试框架**：新增 Playwright 配置（`playwright.config.ts`、`tests/`），覆盖管理后台端到端测试。
- **GitHub Actions**：新增 `.github/` CI 工作流。

### 变更

- **AppResolver 中间件**：修复多应用域名解析逻辑，正确提取 `slug` 和 `app`。
- **清理旧资源**：移除废弃的 `www/assets/` 静态文件（CSS/JS/图片/字体），统一迁移至 `www/assets.lostsky.work/`。
- **.gitignore**：新增 Playwright 相关忽略规则。

## v0.0.10 (2026-06-29)

### 新增

- **可见性系统**：新增 `Visibility` 枚举（`public`/`member`/`admin`/`private`），替代旧的 `DocScope` 枚举。统一的可见性层级适用于文档、成员资料、团队设置等多个场景。
- **管理范围枚举**：新增 `ManageScope` 枚举（`team`/`member`），用于标识某个设置由团队管理员还是成员个人管理。
- **Visibility 服务**：新增 `app/service/Visibility.php`，封装可见性校验逻辑，支持基于 Visibility 层级过滤数据。
- **VisibilityTarget 模型**：新增 `app/model/VisibilityTarget.php`，存储团队各项资源的可见性配置。
- **OpenAPI 文档**：新增 `docs/openapi/` 目录，包含项目的 OpenAPI/Swagger 规范文档。

### 变更

- **DocTarget 枚举重构**：`DocTarget` 从成员导向的枚举调整为更通用的目标枚举（`team`/`member`），配合 Visibility 系统。
- **Document 服务大幅重构**：文档服务从 `DocScope` 迁移至 `Visibility`，支持更灵活的可见性控制；新增文档统计、批量操作等能力。
- **TeamSetting 服务增强**：新增可见性获取/设置接口，支持团队管理员配置各模块的可见性和管理范围。
- **TeamMemberField 服务增强**：支持字段值按 Visibility 层级筛选展示。
- **模型层更新**：`Document`、`Team`、`TeamMember`、`TeamMemberField`、`TeamMemberProfile`、`TeamProfile`、`TeamSetting` 模型新增可见性相关关联和获取器。
- **移除冗余**：`User` 模型清理无用关联。`DocScope` 枚举删除，功能由 `Visibility` + `ManageScope` 替代。
- **数据库 Schema 更新**：`sql/schema.sql` 新增 `visibility_target` 表，`team_setting` 表新增可见性/管理范围相关字段。
- **验证器**：`Document`、`Member`、`TeamMemberField` 验证器适配可见性字段。
- **AGENTS.md / CLAUDE.md**：开发规范文档同步更新。

### 移除

- **DocScope 枚举**：`app/enum/DocScope.php` 已删除，由 `Visibility` + `ManageScope` 替代。

### 新增

- **成员资料扩展**：`TeamMemberProfile` 新增 `intro_image`（自介图）、`intro_video`（音介视频）、`introduction_markdown`（Markdown 介绍）三个字段，丰富成员展示能力。
- **Display 服务扩展**：对外公开成员资料增加自介图、音介视频、Markdown 介绍字段。

### 变更

- **代码风格统一**：模型 `save()` 方法统一使用数组传参（`$model->save([...])`），替换逐字段赋值的风格。涉及 `Team`、`TeamMember`、`Product`、`PostType`、`Document`、`Display` 等服务。
- **控制器精简**：`Me`、`Member` 控制器提取 `PROFILE_FIELDS` 常量，使用 `$request->only()` 统一收集参数，消除重复的 `$request->has()`/`$request->post()` 模式。
- **验证器扩展**：`Member` 验证器新增 `intro_image`、`intro_video`、`introduction_markdown` 字段规则。
- **模型关联更新**：`TeamMember.profile` 关联的 `bind()` 新增三个字段映射。
- **数据库 Schema**：`team_member_profile` 表新增 `intro_image`、`intro_video`、`introduction_markdown` 列。

## v0.0.8 (2026-06-27)

### 新增

- **团队文件管理**：新增 `team/controller/File` 控制器，支持团队级文件上传与管理。
- **成员字段管理**：新增 `TeamMemberField` 模型（成员自定义字段定义）、`TeamMemberFieldValue` 模型（字段值存储）。支持团队自定义成员扩展字段，含完整 CRUD。
- **服务层**：新增 `TeamMemberField` 服务，封装字段定义与字段值的业务逻辑。
- **验证器**：新增 `TeamMemberField`、`TeamMemberFieldValue` 验证器。
- **模型扩展**：`Team`、`TeamMember` 新增与成员字段的关联关系。

### 变更

- `DocTarget` 枚举微调。
- `Document`、`File` 模型及 `Document`、`File` 服务调整优化。
- `TeamMember` 服务小幅调整。
- 数据库 Schema 新增 `team_member_field`、`team_member_field_value` 两张表。
- 团队文档 (`docs/team.md`) 更新。

## v0.0.7 (2026-06-27)

### 新增

- **客户管理**：新增 `TeamCustomer` 服务（含 CRUD、分页查询）、`shop/controller/Customer` 控制器。
- **CustomerAccess 中间件**：商城客户访问鉴权。
- **公共文档路由**：Document 控制器从 `doc` 应用迁移至 `common` 应用，路由随之调整。

### 变更

- `Context` 中间件增强，提取更多上下文信息。
- `Document` 验证器优化。
- `config/app.php`、`config/middleware.php` 配置更新。
- 文档 (`docs/shop.md`) 新增商城客户接口说明。

## v0.0.6 (2026-06-26)

### 新增

- 项目级 Agent 开发说明 (`AGENTS.md`)。

## v0.0.5 (2026-06-26)

### 新增

- 初始化 Codex 相关配置文件，补充 `.agents/skills` 与 `.claude/settings.json`。

## v0.0.3 (2026-06-26)

### 新增

- **商城模块 (shop)**：商品管理（CRUD、上下架、接单人配置）、订单管理（下单、取消、完成）。订单与流水自动关联，取消时退还预存款。
- **记账模块 (transaction)**：流水管理（CRUD、多维筛选）、客户预存款（充值、余额日志）、发单人-客户绑定、多维统计（汇总/按角色/按成员/按时间/按客户）。
- **枚举体系 (app/enum)**：Gender、LogType、OrderStatus、TransactionType，利用 PHP 8.1 原生枚举，模型通过 `$type` 自动转换。
- **中间件**：TransactionAbility（记账能力校验）、TransactionVerify（成员操作权限）、TransactionAccess（团队管理权限）、ShopAccess（商城管理权限）。
- **模型扩展**：Team、TeamMember、User 新增与商城/记账模块的关联关系。

### 修复

- 全局替换 6 处 `Model::destroy()` 硬删除为软删除（`Device::quitAll`、`Team::dissolve`、`TeamMember::remove` 等）。
- UserProfile 的 `gender` 字段改为枚举类型。

### 变更

- PHP 最低版本从 8.0 提升至 8.1（枚举语法依赖）。
- 所有金额运算交给数据库 `inc()/dec()` 链式调用，避免 PHP 浮点精度问题。
- 项目规范完善（字段命名、null 语义、数据计算策略等）。

## v0.0.2 (2026-06-23)

### 新增

- README 安装指南和项目概览。

## v0.0.1 (2026-06-23)

### 新增

- 初始发布：基于 ThinkPHP 8 的纯后端 API 服务。
- 多应用架构：account（认证）、console（控制台）、display（展示）、team（团队）。
- JWT 认证体系（JwtAuth / Context / MemberAccess / TeamAccess 中间件）。
- Personal-as-Team 模型：个人注册自动创建 `type=personal` 的 Team。
- 团队域名路由、成员岗位类型管理。
- 防重放攻击中间件（Dedup）。
- CLI 命令 `make:model` 支持 LostSky 模型骨架。
- 完整的数据库 Schema。
