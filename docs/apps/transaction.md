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

除 `GET /workspace/access` 外，所有接口都经过 `JwtAuth`、`Context`、允许 Team、成员和虚拟实体的 `EntityType`、`TeamAuth` 与 `Ability:transaction`；客户不进入后台记账工作台。Ability 缺失时前端只读取访问快照，不请求任何业务接口。

- 流水查询、创建/编辑、删除分别要求 `transaction.read`、`transaction.write`、`transaction.delete`，写操作继续叠加 `TransactionVerify`。
- 统计要求 `transaction.report.read`。
- 绑定查询要求 `transaction.read`；绑定和解绑要求 `transaction.write`。
- 余额日志要求 `transaction.read`；充值要求 `transaction.write`。

个人接口不接收 Entity ID：`/personal/transactions*`、`/personal/stats`、`/personal/services*` 与 `/personal/bindings` 只从当前 `acting_entity` 取得范围，即使当前角色拥有团队全量读取 Permission 也不会扩大结果。

## 接口契约

具体路径、筛选参数、统计类型和响应结构见 [`transaction.openapi.json`](../openapi/transaction.openapi.json)。

后端回归测试使用项目 `.env` 指向的 MySQL 数据库，并自动回滚或清理隔离测试数据：

```bash
npm run test:backend
```

## 服务核销与统计口径

Transaction 将“服务包收款”和“服务核销”作为独立流水类型。收款流水只进入现金或预存款口径；核销流水使用 `service_credit`，进入履约、接单与分成口径而不重复形成现金收入。每个服务实例最多关联一条核销流水。

当前接单 Entity 可读取自己的核销任务；`service.redemption.read` 或 `service.redemption.manage` 扩大为全量读取，`service.redemption.manage` 允许改派、处理取消申请和确认完成。Transaction API 整体要求有效 Transaction Ability；Ability 缺失时访问快照仍可解释原因，但核销接口不会执行。底层履约服务保留非 Transaction 调用的无流水降级语义。
