# Changelog

## v0.0.9 (2026-06-27)

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
