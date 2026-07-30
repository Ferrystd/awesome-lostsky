# Admin 应用

Admin 是不依赖团队上下文的平台治理后台，前端入口为 `admin.lostsky.work`。它管理 LostSky 平台本身，不代替 Team 应用处理团队内容。

## 业务职责

- 展示平台状态、近期用户与团队、需要关注的封禁状态和最近审计事件。
- 查询用户、脱敏联系方式、团队关系和有效设备；按独立权限使用完整手机或邮箱搜索并查看完整联系方式。
- 封禁或解封用户、撤销用户全部设备与 refresh token。解封不会恢复旧会话。
- 查询团队、所有者、成员规模、域名和能力；封禁或解封团队，不修改团队内容，也不影响用户在其他团队的会话。
- 维护平台管理员、平台角色及权限并集。
- 查询集中业务审计事件和经过脱敏的系统健康状态。

首版不提供用户删除、密码重置、身份代办、团队内容编辑、能力授权、域名管理、订单交易管理、审计导出、队列重试或自动修复。

## 鉴权与安全边界

所有接口先经过 `JwtAuth`、`Context` 和 `AdminAccess`，再由 `AdminPermission` 校验具体平台权限。平台权限来自 `platform_admin_role`、`platform_admin_role_permission` 和 `platform_admin_user_role`，与团队角色完全隔离。

`super_admin` 是不可编辑、不可删除的系统角色，并短路为全部平台权限。后台禁止修改自己的管理员角色、封禁自己的账号，以及任何会导致平台没有可用超级管理员的操作。仍有管理员绑定的自定义角色不能删除。

用户和团队封禁、解封以及用户会话撤销要求 5–500 字原因，并写入 `business_audit_event`。API 管理操作保留请求 ID 和 `api` 来源，CLI 自举操作记录为 `cli`。团队状态变化会同步失效域名解析缓存。写接口继续经过全局请求去重；重复提交已达到的状态不会重复改变资源或写入治理事件。

## 平台权限

- `admin.dashboard.read`
- `admin.user.read`、`admin.user.sensitive.read`
- `admin.user.moderate`、`admin.user.session.revoke`
- `admin.team.read`、`admin.team.moderate`
- `admin.access.read`、`admin.access.write`
- `admin.audit.read`、`admin.system.read`

完整分组和文案以 [`PermissionDictionary`](../../app/service/PermissionDictionary.php) 为事实源。

## 接口与前端

接口契约见 [`admin.openapi.json`](../openapi/admin.openapi.json)。前端路由覆盖平台总览、用户、团队、管理员、角色、审计和系统状态；桌面端使用固定资源侧栏与命令搜索，移动端使用导航抽屉、全屏搜索和字段化记录行。

未登录请求跳转 Account 并保留原地址；已登录但没有平台角色的用户显示明确的 403 页面。前端权限只控制导航和操作入口，服务端中间件始终是授权事实源。

## 自举与发布

首位超级管理员必须通过服务器终端授予：

```bash
php think admin:grant --user=123 --role=super_admin
php think admin:revoke --user=123 --role=super_admin
```

CLI 变更以 `source=cli` 写入平台审计，执行人和实体为空。发布时先应用 [`20260729_admin_platform.sql`](../../sql/patches/20260729_admin_platform.sql) 并发布后端，再授予首位超级管理员，最后发布 Admin 前端和域名配置。

Admin 前端场景可独立运行，不需要启动其他应用：

```bash
npm run test:e2e:admin
```
