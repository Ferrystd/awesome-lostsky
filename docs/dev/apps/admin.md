# Admin 应用

界面专属约束见[后台设计规范：Admin](../design/admin/applications.md#admin)；公共组件、状态和响应式规则不在本页重复。

Admin 是不依赖团队上下文的平台治理后台，前端入口为 `admin.lostsky.work`。它管理 LostSky 平台本身，不代替 Team 应用处理团队内容。

## 业务职责

- 展示平台状态、近期用户与团队、需要关注的封禁状态和最近审计事件。
- 查询用户、脱敏联系方式、团队关系和有效设备；按独立权限使用完整手机或邮箱搜索并查看完整联系方式。
- 封禁或解封用户、撤销用户全部设备与 refresh token。解封不会恢复旧会话。
- 查询团队、所有者、成员规模、域名和能力；按独立权限为团队开通、调整或续期 Ability；封禁或解封团队不修改团队内容，也不影响用户在其他团队的会话。
- 维护平台管理员、平台角色及权限并集。
- 查询集中业务审计事件和经过脱敏的系统健康状态。
- 维护平台 Ability 权益包、公共体验活动与兑换码；平台权益与团队商家服务权益相互隔离。

首版不提供用户删除、密码重置、身份代办、团队内容编辑、Ability 撤销、域名管理、订单交易管理、审计导出、队列重试或自动修复。

## 鉴权与安全边界

所有接口先经过 `JwtAuth`、`Context` 和 `AdminAccess`，再由 `AdminPermission` 校验具体平台权限。平台权限来自 `platform_admin_role`、`platform_admin_role_permission` 和 `platform_admin_user_role`，与团队角色完全隔离。

`super_admin` 是不可编辑、不可删除的系统角色，并短路为全部平台权限。后台禁止修改自己的管理员角色、封禁自己的账号，以及任何会导致平台没有可用超级管理员的操作。仍有管理员绑定的自定义角色不能删除。

用户和团队封禁、解封以及用户会话撤销要求 5–500 字原因，并写入 `business_audit_event`。API 管理操作保留请求 ID 和 `api` 来源，CLI 自举操作记录为 `cli`。团队状态变化会同步失效域名解析缓存。写接口继续经过全局请求去重；重复提交已达到的状态不会重复改变资源或写入治理事件。

## 平台权限

- `admin.dashboard.read`
- `admin.user.read`、`admin.user.sensitive.read`
- `admin.user.moderate`、`admin.user.session.revoke`
- `admin.team.read`、`admin.team.moderate`、`admin.team.ability.write`
- `admin.access.read`、`admin.access.write`
- `admin.audit.read`、`admin.system.read`
- `admin.entitlement.read`、`admin.entitlement.write`

完整分组和文案以 [`PermissionDictionary`](../../app/service/PermissionDictionary.php) 为事实源。

## 接口与前端

接口契约见 [`admin.openapi.json`](../openapi/admin.openapi.json)。前端路由覆盖平台总览、用户、团队、团队 Ability 直接授权、管理员、角色、审计、系统状态和平台权益；侧栏“团队能力”允许仅具备写权限的管理员输入准确 slug 完成授权，不读取或枚举团队目录，团队详情中的“开通能力”只负责预填同一表单。提交后替换相同 Ability 的旧手工授权，并保留兑换活动产生的其他有效授权。桌面端使用固定资源侧栏与命令搜索，移动端使用导航抽屉、全屏搜索和字段化记录行。

未登录请求跳转 Account 并保留原地址；已登录但没有平台角色的用户显示明确的 403 页面。前端权限只控制导航和操作入口，服务端中间件始终是授权事实源。

### 平台权益与兑换活动

侧栏“平台权益”进入 Ability 权益包，“兑换活动”进入活动列表；两个列表页头提供同名次级导航，保留各自的创建主动作。桌面侧栏与移动导航抽屉使用同一入口，空列表和权限受限时仍可导航，读取及发行继续按 `admin.entitlement.read`、`admin.entitlement.write` 校验。

Admin 壳从 768px 起显示固定侧栏，与公共页头的菜单按钮断点对齐，活动新建与详情保持“兑换活动”选中；正文仍从 960px 起使用桌面间距。复用 `LsPageHeader` 动作槽与 `LsButton` 次级导航，不穿透组件内部样式，无新增例外。`tests/admin.spec.ts` 覆盖 767/768、959/960px 边界、键盘导航、空态与受限态。

管理员先创建权益包，选择能力、等级和持续天数（0 表示永久），再进入“兑换活动”创建活动并选择权益包及模式。保存活动后在“发行体验码”中填写数量并发行；定向团队卡还需填写目标 Team ID。团队在“团队设置 → 团队能力”检查兑换码并确认兑换。

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

## 官网内容

后台 `/site-content` 统一维护 `www.lostsky.work` 的 ICP 备案号、核心人员和团队优势指标。`admin.site.read` 允许读取，`admin.site.write` 允许整组保存；两者独立授予，编辑表单需要读取权限。内容数组顺序就是展示顺序，人员最多 20 项、指标最多 12 项，支持新增、移除、排序和隐藏。头像只接受已有图片的 HTTPS 地址，未填写时使用姓名缩写，不新增上传入口。

一次保存原子替换整组内容并在同一事务写入平台审计；保存后官网刷新即生效。表单使用共享草稿同步和离开保护，保存期间的新输入保持未保存状态。读取失败可重试，失败不覆盖草稿。

未修改、保存中、排序边界和数量上限通过操作按钮的短时反馈说明原因；鼠标与键盘触发均不产生受限操作或重复保存请求。

公开接口由 Common 提供，要求 `X-LostSky-App: common`，无登录依赖，只返回可见人员和指标，不缓存。未配置时使用 `config/site-content.json` 中的历史首页内容；官网网络失败保留原始内容，结构与样式保持不变。首次部署前执行 `sql/patches/20261005_site_content.sql`，再发布后端与前端；已有配置不会被静态构建覆盖。
