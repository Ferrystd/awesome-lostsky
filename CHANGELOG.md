# Changelog

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
