# Account 应用

界面专属约束见[后台设计规范：Account](../design/admin/applications.md#account)；认证流程保持专属布局，但主题、控件和主体识别遵守公共规范。

Account 是不依赖团队上下文的账户入口，负责统一账号、设备会话以及用户可访问的团队。当前无团队应用配置见 [`config/app.php`](../../config/app.php) 的 `teamless_apps`。

## 业务职责

- 使用手机号和短信验证码注册账号，并在注册时设置密码。
- 使用手机号和短信验证码登录，或使用手机号、用户名、邮箱加密码登录，签发设备关联的短期 access JWT 和一次性轮换 refresh token。
- 使用独立 refresh token 轮换基础登录 JWT；服务端只保存哈希，检测到宽限期外重放时撤销整个设备。
- 退出当前设备、指定设备或全部设备的登录态。
- 查询用户加入或创建的团队，以及创建团队。
- 统一列出、领取和放弃实体身份；基础 user 可直接领取本人关联的有效成员或客户，entity 可按目标团队授予的角色跨团队继续委托。
- 维护可撤销的父子实体会话证明链；每次切换 supersede 旧 JWT、继承根到期时间，并在每次请求重验整条授权链。

账号是跨团队共享的，不为每个团队建立独立登录体系。账号不会自动生成“个人空间”；个人有工作空间需求时自行创建普通团队，单人团队与多人团队使用相同模型、权限与生命周期。

## 鉴权边界

- 注册、登录和 refresh token 轮换不要求 access JWT。
- `POST /verification/sms` 按 `purpose=register|login` 发送验证码；注册必须校验未注册手机号，登录必须校验已注册手机号。
- 短信类型使用 `SmsType` 枚举，并在 `config/auth.php` 的 `sms.type` 中选择：`SmsType::AliyunSms` 使用阿里云短信服务并由应用生成、缓存和核验验证码；`SmsType::AliyunPnvsSms` 使用号码认证服务的短信认证，由阿里云生成并核验验证码。号码认证通道不使用融合认证或一键取号。
- 调试绕过必须同时满足 `.env` 中的 `APP_DEBUG=true` 和 `config/auth.php` 中的 `sms.debug_bypass=true`。绕过时不调用短信服务，验证码输入任意内容均可通过；任一条件不满足时都执行真实核验。
- 设备与团队入口经过 `JwtAuth` 和 `Context`，始终按 JWT 中的真实用户 ID 操作，不限制当前是否携带团队、成员、客户或虚拟实体身份。
- Account 不要求请求域名提供团队 slug；选择团队后，其他应用再从域名解析团队上下文。
- `/identity/candidates` 在基础 JWT 下返回本人有效成员/客户，在 entity JWT 下跨团队返回当前实体通过目标团队角色可领取的全部目标。
- `/identity/receive` 以全局 slug 解析目标。entity 委托只检查实体有效性及目标团队授予来源实体的精确或通配 assume Permission，不限制团队、目标类型、深度或重复实体。
- `/identity/member` 同时接受基础用户或已有实体 JWT，并以 JWT 中的真实用户 ID 重置到 `team_slug` 对应的本人有效成员；`/identity/drop` 回到基础 user JWT。
- Account 前端 `/identity` 提供通用身份选择与放弃，`/identity/member-callback` 处理业务应用缺少身份或团队不匹配后的成员领取。团队不匹配时必须由用户确认，取消和领取失败都不撤销原身份。

实体会话和跨团队授权链的完整约束见[《Entity 身份与跨团队委托》](../architecture/entity-authorization.md)。

## 接口契约

具体路径、请求字段和响应结构见 [`account.openapi.json`](../openapi/account.openapi.json)。

认证相关入口：

- `POST /verification/sms`：发送注册或登录验证码。
- `POST /register/sms`：短信验证码注册并设置密码；`/register/phone` 保留为兼容别名。
- `POST /login/sms`：短信验证码登录。
- `POST /login/password`：手机号、用户名或邮箱加密码登录；`/login/phone` 保留为手机号密码兼容入口。
