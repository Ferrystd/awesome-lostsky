# Chat 应用

Chat 负责团队聊天、成员与客户资料、团队及虚拟实体身份、实时订阅和 Webhook 集成。

## 身份与鉴权边界

- `identity/candidates` 与 `identity/receive` 只接受 `teamless` 基础用户 JWT。
- `identity/drop` 只接受 `team`、`teamMember`、`teamCustomer` 或 `teamVirtual` 实体 JWT；切换身份必须先放弃当前实体。
- 团队选择列表接受基础用户和四种实体 JWT，不要求当前团队上下文。
- 团队内聊天业务接受四种实体 JWT，并按 `JwtAuth → Context → EntityType → TeamBelongs → ChatAccess/Permission` 执行。
- 客户资料入口只接受属于当前团队的 `teamCustomer`。
- Integration 外部发送入口使用独立集成令牌，不经过用户或实体 JWT 中间件。

`EntityType` 的参数内部按 OR 处理；`TeamBelongs` 只验证实体与当前团队的归属。实体状态、领取权、
会话访问和角色权限分别由 `JwtAuth`、`ChatAccess`、`Permission` 与服务层继续校验。

## 接口契约

具体路径、请求字段和响应结构见 [`chat.openapi.json`](../openapi/chat.openapi.json)。
