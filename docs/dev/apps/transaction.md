# Transaction 应用

界面专属约束见[后台设计规范：Transaction](../design/admin/applications.md#transaction)；公共组件、状态和响应式规则不在本页重复。

Transaction 负责团队记账流水、基于顾客归属与协作关系的数据范围，以及顾客预存款管理。顾客协作关系本身由 Team 顾客管理维护。

## 业务职责

权益下发支持已启用的核销商品和原有服务套餐，按商品当前配置生成独立权益，不创建商城订单；普通商品不进入权益下发或核销流程。顾客可见范围、下发 Permission 和 Transaction Ability 要求不变。

- 在个人工作台登记流水；在团队工作台查询、编辑和删除全量流水。
- 查询当前团队的全部有效实体、顾客、顾客归属及余额，作为流水和充值表单的统一选项来源。
- 按汇总、角色实体、时间、顾客或人员生成统计结果；人员统计支持服务端排序与分页，时间趋势支持小时粒度。
- 查询当前实体归属或协作发单的顾客，在“我的顾客”合并展示并用于个人记账范围；团队侧在 Team 顾客详情维护关系。
- 查询顾客余额日志并执行充值。
- 从 Shop 已启用的服务套餐商品读取快照，直接赋予顾客独立权益；该动作不创建 Shop 订单。
- 个人工作台按当前 Entity 强制筛选我的流水（含个人业绩统计）、我的接单、我的顾客和本人权益下发记录，并允许有专用 Permission 的发单人为本人接待顾客下发权益。
- 团队工作台基础概览始终展示团队摘要；具体流水、统计、核销与余额的数据读取和操作按 Permission 收口，入口保持可达，受限操作在点击时说明原因。
- 顶栏直显团队、商品、记账、聊天和微博五入口，不使用应用下拉或个人/团队分段控件；团队概览和流水主页面进入个人模式，个人模式从顶栏“记账”返回。

流水编辑不允许更换 `handler_entity_id`；涉及余额和多模型变更的操作由服务层事务保证一致性。
预存款支付必须关联本团队顾客，接单、发单和客服主体必须是本团队有效实体；所有金额均为非负有限数值。
登记流水入口只位于个人工作台；Team Entity 可使用团队全部顾客候选，成员和虚拟 Entity 只看到当前归属或发单绑定顾客。无顾客或无归属顾客默认由当前 Entity 发单；有归属顾客默认由归属 Entity 发单、当前 Entity 担任客服。默认值允许同一 Entity 同时承担多个业务身份，且填写后仍可手动调整，提交时继续由服务端按顾客当前归属覆盖发单快照。

## 鉴权边界

所有后台接口都经过 `JwtAuth` 和 `Context`。团队范围接受四类有效 Entity，通过 `TeamWorkspaceAuth` 后再检查具体 Permission；外部 Entity 必须有目标团队角色。个人流水和接单使用 `TeamAuth`，只接受本团队 Team、成员和虚拟实体；个人权益下发控制器接受四类本团队 Entity，再由服务限定顾客范围。`Ability:transaction` 只作用于 `POST /transaction`、`POST /transaction/balance/recharge`、团队与个人权益赋予提交，以及 `POST /personal/service-offers/{id}/accept`。列表、详情、候选、统计和其他核销管理动作不因 Ability 缺失被拦截；完成核销时服务层仍只在 Ability 有效时写入流水和加价业绩。

- 团队全量流水查询、编辑、删除分别要求 `transaction.read`、`transaction.write`、`transaction.delete`；个人登记流水要求 `transaction.write`，创建与编辑继续叠加 `TransactionVerify`。
- 团队全量统计要求 `transaction.report.read`。
- 余额日志要求 `transaction.read`；充值要求 `transaction.write`。
- 团队“服务核销”入口、列表、详情与接单池要求 `service.redemption.read` 或 `service.redemption.manage`；改派、处理取消、从团队入口确认完成与费用调整要求 `service.redemption.manage`。个人入口允许当前接单 Entity 在任务详情页填写接单字段、领取任务并完成自己的任务，不授予团队管理能力。
- 团队工作台手动赋予权益的候选要求 `transaction.write`，确认提交还要求 Transaction Ability。个人“权益下发”列表不要求业务 Permission，只读取当前 Entity 自己直接下发的记录；列表中的“下发权益”按钮、候选与提交要求 `service.entitlement.grant`，点击“下发权益”和最终提交时还会核对 Transaction Ability，并强制顾客处于当前归属或发单绑定范围、发单人为当前 Entity。两种下发动作都不要求 Shop Ability；商品仍由 Shop 后台和商品 Permission 管理。

个人接口不接收 Entity ID：`/personal/transactions*`、`/personal/stats`、`/personal/services*`、`/personal/service-offers*`、`/personal/customers`、`/personal/entitlements` 与 `/personal/entitlement-grant*` 只从当前 `acting_entity` 取得范围，即使当前角色拥有团队全量读取 Permission 也不会扩大结果。“我的流水”页面同时请求参与流水和个人统计，不再提供独立“我的业绩”页面。“我的顾客”把当前归属和协作发单顾客合并为一份去重列表，并分别返回两种关系标记。我的流水、我的接单、我的顾客和本人下发记录的读取不要求业务 Permission；`transaction.read` 与 `transaction.report.read` 只开放 Team 全量读取。接单工作台按“待我确认 / 我可以接 / 我的接单”分组；服务配置显式接单池时以池内资格作为接受邀请和抢单的授权，接单池留空时团队内全部有效的 Team、成员和虚拟 Entity 都具备资格，不新增普通接单 Permission。

## 接口契约

具体路径、筛选参数、统计类型和响应结构见 [`transaction.openapi.json`](../openapi/transaction.openapi.json)。

后端回归测试使用项目 `.env` 指向的 MySQL 数据库，并自动回滚或清理隔离测试数据：

```bash
npm run test:backend
```

## 服务核销与统计口径

Transaction 将“服务包收款”“服务核销”“履约加价收款”和“履约加价业绩”作为独立流水类型。收款流水只进入现金或预存款口径；核销与加价业绩使用 `service_credit` 进入履约、接单与分成口径而不重复形成现金收入。每个履约切片最多关联一条基础核销流水，每项费用调整分别关联收款与业绩流水。

团队人员统计中，接单数按普通商城订单、记账登记和每次服务核销计算，履约加价业绩只增加接单业绩而不增加单数；经营统计的接单人辅助排行复用该口径，按接单数从高到低排列并直接显示单数。发单数按普通商城订单、记账登记和服务包收款计算，后续核销不重复计数。发单业绩累计上述成交与履约加价收款的现金与预存款实付金额；个人收入仍累计其作为接单人、发单人和客服取得的全部分成。

个人统计使用同一口径：总接单数计算普通商城订单、记账登记和每次服务核销；总发单数计算普通商城订单、记账登记和服务包收款；总接待数保持现有非纯收款口径。月度业绩与个人业绩汇总本人的普通成交、服务核销和履约加价业绩；月度流水继续汇总当月本人参与流水的现款与预存款收入。

个人工作台由当前接单 Entity 读取自己的核销任务，不要求业务 Permission；本人可以在任务详情填写“核销接单时”字段并完成自己的任务，服务端按当前 `acting_entity` 与任务接单人再次校验。接受指定邀请时额外要求 Transaction Ability，领取公开任务、退回和完成本人任务不要求。团队工作台的全量权益核销入口和读取要求 `service.redemption.read` 或 `service.redemption.manage`，`service.redemption.manage` 允许改派、处理取消申请、确认完成与费用调整；这些管理动作不因 Transaction Ability 缺失停止，但只有 Ability 有效时才生成记账流水。

“权益下发”列表只返回当前 Entity 作为发单人直接下发、且没有商城订单或卡密来源的服务权益，支持按权益、商品或顾客名称搜索；记录显示顾客、来源商品、下发与剩余额度、状态、下发时间和有效期。“下发顾客权益”只接受当前团队已启用、已关联有效权益包的服务套餐商品。团队入口中，Team Entity 可选择当前团队全部有效顾客，成员和虚拟 Entity 只看到当前归属或发单绑定范围内的顾客，提交时由 `TransactionVerify` 再次校验；个人入口无论当前 Entity 类型都只显示其当前归属或发单绑定顾客，服务端再次校验并强制发单人为当前 Entity，提交的其他发单人 ID 不生效。权益来源记录商品但不记录订单，持有人固定为 Customer 根 Entity；份数会复制整份权益包，发单与客服快照用于后续核销分成。`shop.sync_manual_entitlement_transaction` 关闭时只创建权益；开启且 Transaction Ability 有效时，在同一事务中增加一笔“服务包收款”，仍不创建 Shop 订单。

指定邀请接受时才创建核销切片；公开任务在 Customer 提交时已经是核销中、接单人为空。个人列表只进入详情，接受邀请和领取公开任务都必须在任务详情页填写“核销接单时”字段后提交。公开任务允许按最小核销单位领取部分数量，剩余数量继续留在公开池；领取通过行锁保证同一部分只有一个 Entity 成功。接单人可填写原因退回自己的未完成任务，任务保持核销中并重新公开；存在待处理取消申请时必须先处理取消，不能退回。
