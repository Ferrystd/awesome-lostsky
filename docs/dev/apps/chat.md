# Chat 应用

界面专属约束见[后台设计规范：Chat](../design/admin/applications.md#chat)；会话布局保留专属模式，但主题、控件和主体识别遵守公共规范。

Chat 只负责团队会话、消息、参与身份选择、实时订阅和 Webhook 运行时。统一实体字段定义、虚拟实体和 Webhook 集成的完整管理入口属于 Team 应用；Chat 路由仍提供实体字段读取、值读写和字段创建接口，权限仍按当前实体校验。Team、成员与虚拟实体自我管理属于 Team 个人工作台，顾客资料属于商城顾客中心，身份领取与切换属于 Account。

## 身份与鉴权边界

- 实体身份的列出、领取、放弃和按团队领取成员均归 Account；Chat 不再提供身份接口或身份页面。
- 团队选择列表接受基础用户和四种实体 JWT，不要求当前团队上下文。
- 团队内聊天业务只接受四种实体 JWT，并按 `JwtAuth → Context → TeamAuth → EntityType → ChatAccess/Permission` 执行；`ChatAccess` 只使用当前 actor，不从真实 user 关联的成员或顾客回退。缺少实体或团队不匹配时由统一错误契约引导到 Account 回调。
- Chat 顶栏保留单一消息工作台并固定提供五应用切换，不显示个人/团队模式。桌面直接显示团队、商品、记账、聊天和微博，移动端与 Team 一致收进“操作”菜单，不使用“切换应用”下拉按钮。资料动作按当前 JWT 身份进入 Team 个人工作台或商城顾客中心；Team Entity 与成员、虚拟实体使用同一 Team 个人入口，消息编辑器临时选择的发送身份不参与该判断。Customer 的商品入口进入商城顾客中心，团队、记账与微博项保留为带原因的禁用态。
- 旧 `/profile` 仅作页面兼容跳转，不再渲染或代理顾客资料接口。
- Integration 外部发送入口使用独立集成令牌，不经过用户或实体 JWT 中间件。

`EntityType` 的参数内部按 OR 处理；`TeamAuth` 由 `EntityRequired → TeamBelongs` 组成。实体状态、领取权、
会话访问和角色权限分别由 `JwtAuth`、`ChatAccess`、`Permission` 与服务层继续校验。

事件 outbox 和 Webhook 投递通过短期 `processing_token + processing_until` 原子领取；处理结果只能由持有该租约 token 的 worker 确认，避免多个 worker 同时消费同一行。

## 接口契约

具体路径、请求字段和响应结构见 [`chat.openapi.json`](../openapi/chat.openapi.json)。

出站集成使用 [Standard Webhooks 协议](../development/webhooks.md)，外部开发者可从[最小 SDK 接入](../development/webhook-quickstart.md)开始。
