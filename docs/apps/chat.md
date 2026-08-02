# Chat 应用

界面专属约束见[后台设计规范：Chat](../design/admin/applications.md#chat)；会话布局保留专属模式，但主题、控件和主体识别遵守公共规范。

Chat 只负责团队会话、消息、参与身份选择、实时订阅和 Webhook 运行时。统一实体字段定义、虚拟实体和 Webhook 集成的管理入口属于 Team 应用；客户资料由 Shop 顾客中心维护，成员资料由 Team 维护，身份领取与切换由 Account 维护。Chat OpenAPI 只保留聊天运行时接口。

## 身份与鉴权边界

- 实体身份的列出、领取、放弃和按团队领取成员均归 Account；Chat 不再提供身份接口或身份页面。
- 团队选择列表接受基础用户和四种实体 JWT，不要求当前团队上下文。
- 团队内聊天业务只接受四种实体 JWT，并按 `JwtAuth → Context → TeamAuth → EntityType → ChatAccess/Permission` 执行；`ChatAccess` 只使用当前 actor，不从真实 user 关联的成员或客户回退。缺少实体或团队不匹配时由统一错误契约引导到 Account 回调。
- Chat 顶栏按 JWT 中的当前认证身份跳转管理入口：客户前往 Shop 顾客中心，成员前往 Team“我的资料”，其余身份前往 Account 身份选择；消息编辑器临时选择的发送身份不参与该判断。
- 旧 `/profile` 仅作页面兼容跳转，不再渲染或代理客户资料接口。
- Integration 外部发送入口使用独立集成令牌，不经过用户或实体 JWT 中间件。

`EntityType` 的参数内部按 OR 处理；`TeamAuth` 由 `EntityRequired → TeamBelongs` 组成。实体状态、领取权、
会话访问和角色权限分别由 `JwtAuth`、`ChatAccess`、`Permission` 与服务层继续校验。

事件 outbox 和 Webhook 投递通过短期 `processing_token + processing_until` 原子领取；处理结果只能由持有该租约 token 的 worker 确认，避免多个 worker 同时消费同一行。

## 接口契约

具体路径、请求字段和响应结构见 [`chat.openapi.json`](../openapi/chat.openapi.json)。
