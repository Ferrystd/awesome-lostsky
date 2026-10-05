# Chat 应用

界面专属约束见[后台设计规范：Chat](../design/admin/applications.md#chat)；会话布局保留专属模式，但主题、控件和主体识别遵守公共规范。

Chat 使用 `chat.lostsky.work` 统一入口，由当前 Entity 参与单聊、群聊、消息、邀请和实时订阅。群聊的团队管理、统一实体字段、虚拟实体与 Webhook 集成管理归 Team；身份领取与切换归 Account。旧版升级步骤见[部署与迁移](../operations/deployment.md#chat-teamless-upgrade)。

## 业务边界

- 普通单聊由双方 Entity 唯一确定，可跨团队。准确 slug 可发起联系；实体搜索仍遵守可发现性，不能通过名称搜索枚举隐藏对象。
- 任一方屏蔽后，双方均不能继续单聊发送，已有历史仍可阅读；群聊消息不受个人屏蔽影响。
- 群聊继续归属 Team，参与者可来自不同团队。新参与者须接受邀请后才能阅读历史；移除后失去访问权，既有成员在迁移中保留。
- Team 的 `chat.group.manage` 管理本团队全部群聊，包括创建、资料、成员、历史消息、撤回和关闭，不要求管理员先参与会话；个人单聊不进入团队管理范围。
- Chat 内只读展示当前 Entity，提供前往 Account 的身份切换入口。创建、发送、编辑、撤回、已读、屏蔽和邀请响应使用认证上下文中的 Entity，写请求校验 `expected_entity_id`。
- 团队归属不构成参与单聊的门槛，但 Entity 本身、根身份和委托链仍必须有效。虚拟实体代发权限退出聊天运行时，使用虚拟身份须先通过 Account 正式委托。
- 旧团队 Chat 页面保留跳转，新服务通过 UUID 别名解析迁移前单聊链接。正式迁移前须备份并暂停写入及事件消费。

## 身份与鉴权边界

- 实体身份的列出、领取、放弃和按团队领取成员均归 Account；Chat 不再提供身份接口或身份页面。
- Chat 使用四种有效 Entity JWT；请求先经过 `JwtAuth`、`Context` 和 `EntityRequired`，随后按参与关系校验会话访问，不要求身份属于地址中的团队。缺少 Entity 时由统一错误契约引导到 Account 身份选择页。
- Team 群管理请求使用目标团队的工作台准入和 `chat.group.manage`；团队 ID 来自 Team 地址并与群聊所属团队核对，不能由客户端会话参数替换。
- Chat 顶栏保留单一消息工作台，不显示个人/团队模式。前往其他应用时的导航团队不赋予聊天访问权；资料动作按当前 JWT 身份进入 Team 个人工作台或商城顾客中心。
- 旧 `/profile` 仅作页面兼容跳转，不再渲染或代理顾客资料接口。
- Integration 外部发送入口使用独立集成令牌，不经过用户或实体 JWT 中间件；令牌固定到虚拟 Entity，发送前检查实体有效性和会话参与资格。

管理者可以在 Team 阅读和治理群聊，但不能凭管理权替其他 Entity 发消息。身份切换须更新缓存与实时连接；服务端也必须校验叶会话和参与资格，不能仅依赖前端隐藏入口。

事件 outbox 和 Webhook 投递通过短期 `processing_token + processing_until` 原子领取；处理结果只能由持有该租约 token 的 worker 确认，避免多个 worker 同时消费同一行。

## 接口契约

具体路径、请求字段和响应结构见 [`chat.openapi.json`](../openapi/chat.openapi.json)。

## 消息规则

本人消息可在发送后 5 分钟内编辑、2 分钟内撤回，操作时仍须属于该会话。Team 群管理者可按管理权限撤回本团队群消息。聊天设置仅保留 `retention_days`，用于清理本团队群聊消息；0 表示永久保留，单聊不受团队保留策略影响。

## 页面入口

- `/` 展示当前 Entity 的会话，可用 `conversation=<uuid>` 定位会话；旧 UUID 由服务端解析到归并后的会话。参数只定位，不执行写操作。
- `/new?participant=<slug>` 预填单聊对象，仍须用户提交；未提供对象时使用人员查找。
- `/requests` 处理群邀请与屏蔽名单。
- `/profile` 转往 Account 身份页面。身份切换的 `redirect` 使用公共安全返回地址规则。
- 团队群管理位于 Team 的 `/chat-groups`、`/chat-groups/new` 和 `/chat-groups/:uuid`，按目标团队授权。

出站集成使用 [Standard Webhooks 协议](../development/webhooks.md)，外部开发者可从[最小 SDK 接入](../development/webhook-quickstart.md)开始。

已删除消息或会话的 outbox 终止发布，对应待投递 Webhook 标为失败并释放租约；上下文异常按投递错误处理，不中断整批处理或重新暴露删除内容。团队管理员可以撤销失效实体的已有邀请和群参与关系，个人也可以解除已有失效实体屏蔽；新邀请、屏蔽和消息发送继续要求有效实体。
