# Transaction 应用

界面专属约束见[后台设计规范：Transaction](../design/admin/applications.md#transaction)；公共组件、状态和响应式规则不在本页重复。

Transaction 负责团队记账流水、客户与发单人的绑定关系，以及顾客预存款管理。

## 业务职责

- 查询、创建、编辑和删除流水。
- 查询当前团队的全部有效实体、客户及余额，作为流水、绑定和充值表单的统一选项来源。
- 按汇总、角色实体、时间或客户生成统计结果。
- 查询当前实体或全团队的客户绑定关系，并由管理员维护绑定。
- 查询顾客余额日志并执行充值。
- 个人工作台按当前 Entity 强制筛选相关流水、个人业绩、本人核销与客户协作/发单绑定。
- 团队工作台基础概览始终展示团队摘要；具体流水、统计、核销、绑定与余额操作按 Permission 禁用并说明原因。
- 顶栏直显团队、商品、记账和聊天四入口，不使用应用下拉或个人/团队分段控件；团队概览和流水主页面进入个人模式，个人模式从顶栏“记账”返回。

流水编辑不允许更换 `handler_entity_id`；涉及余额和多模型变更的操作由服务层事务保证一致性。
预存款支付必须关联本团队客户，接单、发单和客服主体必须是本团队有效实体；所有金额均为非负有限数值。

## 鉴权边界

所有后台接口都经过 `JwtAuth`、`Context`、允许 Team、成员和虚拟实体的 `EntityType` 与 `TeamAuth`。除 `GET /workspace/access` 和 `POST /service/{id}/complete` 外，业务接口继续要求 `Ability:transaction`；客户不进入后台记账工作台。`complete` 只豁免 Ability，不豁免 `service.redemption.manage`，用于收口 Ability 有效时已经开始的履约义务；服务层在 Ability 无效时跳过流水和加价业绩写入。

- 流水查询、创建/编辑、删除分别要求 `transaction.read`、`transaction.write`、`transaction.delete`，写操作继续叠加 `TransactionVerify`。
- 统计要求 `transaction.report.read`。
- 绑定查询要求 `transaction.read`；绑定和解绑要求 `transaction.write`。
- 余额日志要求 `transaction.read`；充值要求 `transaction.write`。

个人接口不接收 Entity ID：`/personal/transactions*`、`/personal/stats`、`/personal/services*`、`/personal/service-offers*` 与 `/personal/bindings` 只从当前 `acting_entity` 取得范围，即使当前角色拥有团队全量读取 Permission 也不会扩大结果。接单工作台按“待我确认 / 我可以接 / 我的核销”分组；接单池资格本身就是接受邀请和抢单的授权，不新增普通接单 Permission。

## 接口契约

具体路径、筛选参数、统计类型和响应结构见 [`transaction.openapi.json`](../openapi/transaction.openapi.json)。

后端回归测试使用项目 `.env` 指向的 MySQL 数据库，并自动回滚或清理隔离测试数据：

```bash
npm run test:backend
```

## 服务核销与统计口径

Transaction 将“服务包收款”“服务核销”“履约加价收款”和“履约加价业绩”作为独立流水类型。收款流水只进入现金或预存款口径；核销与加价业绩使用 `service_credit` 进入履约、接单与分成口径而不重复形成现金收入。每个履约切片最多关联一条基础核销流水，每项费用调整分别关联收款与业绩流水。

当前接单 Entity 可读取自己的核销任务；`service.redemption.read` 或 `service.redemption.manage` 扩大为全量读取，`service.redemption.manage` 允许改派、处理取消申请和确认完成。Transaction Ability 缺失时访问快照解释原因，列表、改派、取消和费用调整不执行；唯有已开始履约的完成动作可继续，并明确降级为“完成状态但不生成或后补流水”。

指定邀请接受时才创建核销切片；公开任务在 Customer 提交时已经是核销中、接单人为空。接单 Entity 领取前可读取完整核销字段，领取通过行锁保证唯一成功。接单人可填写原因退回自己的未完成任务，任务保持核销中并重新公开；存在待处理取消申请时必须先处理取消，不能退回。
