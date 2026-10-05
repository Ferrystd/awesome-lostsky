# Account 应用

界面专属约束见[后台设计规范：Account](../design/admin/applications.md#account)；认证流程保持专属布局，但主题、控件和主体识别遵守公共规范。

Account 是不依赖团队上下文的账户入口，负责统一账号、设备会话以及用户可访问的团队。当前无团队应用配置见 [`config/app.php`](../../config/app.php) 的 `teamless_apps`。

## 业务职责

- 使用手机号和短信验证码注册账号，并在注册时设置密码。
- 使用手机号和短信验证码登录，或使用手机号、用户名、邮箱加密码登录，签发设备关联的短期 access JWT 和一次性轮换 refresh token。
- 使用独立 refresh token 轮换基础登录 JWT；服务端只保存哈希，检测到宽限期外重放时撤销整个设备。
- 退出当前设备、指定设备或全部设备的登录态。
- 查询用户加入或创建的团队，以及创建团队。
- 统一列出、领取和放弃实体身份；基础 user 可直接领取本人关联的有效成员或顾客，entity 可按目标团队授予的角色跨团队继续委托。
- 在团队工作台入口复核外部 Entity 的目标团队角色，并提供跨应用共享的 24 小时外部身份警告确认；确认 Cookie 只控制提示，不参与授权。LostSky 自有域名前端请求 API 时携带凭据，API 对匹配的自有来源返回明确 Origin 与凭据许可；其他来源保留不携带跨域凭据的公开 CORS 行为。
- 解析旧当前实体深链的安全去向：Team、成员与虚拟实体进入 Team 个人工作台，顾客进入对应商城顾客中心。
- 维护可撤销的父子实体会话证明链；每次切换 supersede 旧 JWT、继承根到期时间，并在每次请求重验整条授权链。

账号是跨团队共享的，不为每个团队建立独立登录体系。账号不会自动生成“个人空间”；个人有工作空间需求时自行创建普通团队，单人团队与多人团队使用相同模型、权限与生命周期。

## 鉴权边界

- 注册、登录和 refresh token 轮换不要求 access JWT。
- `POST /verification/sms` 按 `purpose=register|login` 发送验证码；注册必须校验未注册手机号，登录必须校验已注册手机号。
- 短信类型使用 `SmsType` 枚举，并在 `config/auth.php` 的 `sms.type` 中选择：`SmsType::AliyunSms` 使用阿里云短信服务并由应用生成、缓存和核验验证码；`SmsType::AliyunPnvsSms` 使用号码认证服务的短信认证，由阿里云生成并核验验证码。号码认证通道不使用融合认证或一键取号。
- 调试绕过必须同时满足 `.env` 中的 `APP_DEBUG=true` 和 `config/auth.php` 中的 `sms.debug_bypass=true`。绕过时不调用短信服务，验证码输入任意内容均可通过；任一条件不满足时都执行真实核验。
- 设备与团队入口经过 `JwtAuth` 和 `Context`，始终按 JWT 中的真实用户 ID 操作，不限制当前是否携带团队、成员、顾客或虚拟实体身份。
- Account 不要求请求域名提供团队 slug；选择团队后，其他应用再从域名解析团队上下文。
- `/identity/candidates` 在基础 JWT 下返回本人有效成员/顾客，在 entity JWT 下跨团队返回当前实体通过目标团队角色可领取的全部目标。
- `/identity/receive` 以全局 slug 解析目标。entity 委托检查实体有效性及目标团队授予来源实体的精确或通配 assume Permission；来源实体直接绑定的顾客还可按绑定关系领取，不限制团队、目标类型、深度或重复实体。
- `/identity/member` 同时接受基础用户或已有实体 JWT，并以 JWT 中的真实用户 ID 重置到 `team_slug` 对应的本人有效成员；`/identity/drop` 回到基础 user JWT。
- Account 前端 `/identity` 提供通用身份选择与放弃，`/identity/member-callback` 处理缺少身份或严格团队范围不匹配后的成员领取。缺少 Entity 时，每个“真实 user + 目标团队”在一次浏览会话只自动尝试领取一次；失败或刷新后不再重复发送请求，并提供切换身份、切换团队入口。
- `/identity/workspace-warning` 展示外部 Entity 与目标团队，只有目标团队角色仍有效时才允许继续。确认按“当前 Entity + 目标团队”写入 `.lostsky.work` 共享的 HttpOnly、SameSite=Lax 短期 Cookie，默认 86400 秒；Cookie 不替代实时角色与 Permission 校验。
- Account 前端 `/identity/current/*` 仅为旧深链兼容跳转，不再读取或保存实体资料。`GET /identity/target` 只返回当前身份对应的目标类型和团队摘要。

实体会话和跨团队授权链的完整约束见[《Entity 身份与跨团队委托》](../architecture/entity-authorization.md)。

## 接口契约

Chat 的身份选择使用 Account `/identity?redirect=...`，不要求团队 slug。没有当前 Entity 时，Chat 的 `42801` 恢复进入同一入口；完成选择后按公共安全返回地址规则回到 Chat，重新读取该 Entity 的会话。带目标团队的既有成员恢复流程继续保留。

### 个人一次性入队码

`POST /team/join-code` 使用 JWT 中真实 `user_id` 生成个人入队码，不读取委托 Entity 的所属用户，也不接受客户端指定用户。返回 `code`（20 位大写十六进制随机字符串）与 `expires_at`（Unix 秒），响应禁止缓存。有效期 30 分钟，每个账号最多保留一个码；重新生成立即替换旧码。数据库只保存 SHA-256 摘要与到期时间，模型输出隐藏两字段。使用与生成都锁定用户行，成功入队后清空，过期摘要最多占用户原有两个字段并在下次生成时覆盖，不累计历史记录。

团队选择页常态显示一行“入队码：XXX”，进入页面自动生成，点击文字复制，到期后自动生成新码；重新进入页面也会替换旧码，码不写入浏览器持久存储。用户将码交给管理员即可直接加入一次团队，不需要申请表单或二次同意。剪贴板不可用时保留可选择的原码，允许手动复制。部署前执行 `sql/patches/20260918_member_join_code.sql`。

具体路径、请求字段和响应结构见 [`account.openapi.json`](../openapi/account.openapi.json)。

认证相关入口：

- `POST /verification/sms`：发送注册或登录验证码。
- `POST /register/sms`：短信验证码注册并设置密码；`/register/phone` 保留为兼容别名。
- `POST /login/sms`：短信验证码登录。
- `POST /login/password`：手机号、用户名或邮箱加密码登录；`/login/phone` 保留为手机号密码兼容入口。

身份导航入口：

- `GET /identity/target`：解析当前身份应进入的 Team 个人工作台、商城顾客中心或身份选择页；Team Entity 与成员、虚拟实体使用同一 Team 个人入口，不返回业务资料。
- `GET /identity/workspace-warning?team_slug=...`：复核外部 Entity 的目标团队角色并返回警告上下文。
- `POST /identity/workspace-warning/acknowledge`：再次复核角色后确认警告；不授予任何角色或 Permission。

退出设备、退出全部设备以及刷新令牌复用撤权同时撤销对应 EntitySession；平台封禁和设备已撤销状态实时参与叶会话校验，既有实时连接不能继续取得消息发布资格。设备及刷新操作按用户、设备、刷新令牌、实体会话顺序加锁，服务入口在最外层业务事务结束后执行实时断连。
