# Account 应用

Account 是不依赖团队上下文的账户入口，负责统一账号、设备会话以及用户可访问的团队。当前无团队应用配置见 [`config/app.php`](../../config/app.php) 的 `teamless_apps`。

## 业务职责

- 使用手机号注册账号。
- 使用手机号或账号密码登录，并签发设备关联的登录态。
- 退出当前设备、指定设备或全部设备的登录态。
- 查询用户加入或创建的团队，创建团队，以及删除自己拥有的可解散团队。

账号是跨团队共享的，不为每个团队建立独立登录体系。个人空间与协作团队都由 `Team` 模型承载。

## 鉴权边界

- 注册和登录不要求 JWT。
- 设备与团队入口经过 `JwtAuth`、`Context` 和 `EntityType:teamless`，只接受基础用户 JWT。
- Account 不要求请求域名提供团队 slug；选择团队后，其他应用再从域名解析团队上下文。

## 接口契约

具体路径、请求字段和响应结构见 [`account.openapi.json`](../openapi/account.openapi.json)。
