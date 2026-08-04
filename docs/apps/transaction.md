# Transaction 应用

界面专属约束见[后台设计规范：Transaction](../design/admin/applications.md#transaction)；公共组件、状态和响应式规则不在本页重复。

Transaction 负责团队记账流水、客户与发单人的绑定关系，以及顾客预存款管理。

## 业务职责

- 查询、创建、编辑和删除流水。
- 查询当前团队的全部有效实体、客户及余额，作为流水、绑定和充值表单的统一选项来源。
- 按汇总、角色实体、时间或客户生成统计结果。
- 查询当前实体或全团队的客户绑定关系，并由管理员维护绑定。
- 查询顾客余额日志并执行充值。

流水编辑不允许更换 `handler_entity_id`；涉及余额和多模型变更的操作由服务层事务保证一致性。
预存款支付必须关联本团队客户，接单、发单和客服主体必须是本团队有效实体；所有金额均为非负有限数值。

## 鉴权边界

所有接口都经过 `JwtAuth`、`Context`、允许四种团队实体的 `EntityType` 和 `TeamAuth`；基础 JWT 不再静默领取成员，已有实体先验证当前团队归属，再按当前实体校验业务权限。

- 流水查询、创建/编辑、删除分别要求 `transaction.read`、`transaction.write`、`transaction.delete`，写操作继续叠加 `Ability:transaction` 与 `TransactionVerify`。
- 统计要求 `Ability:transaction` 与 `transaction.report.read`。
- 绑定查询要求 `transaction.read`；绑定和解绑要求 `transaction.write`。
- 余额日志要求 `transaction.read`；充值要求 `Ability:transaction` 与 `transaction.write`。

## 接口契约

具体路径、筛选参数、统计类型和响应结构见 [`transaction.openapi.json`](../openapi/transaction.openapi.json)。

后端回归测试使用项目 `.env` 指向的 MySQL 数据库，并自动回滚或清理隔离测试数据：

```bash
npm run test:backend
```

## 服务核销与统计口径

Transaction 将“服务包收款”和“服务核销”作为独立流水类型。收款流水只进入现金或预存款口径；核销流水使用 `service_credit`，进入履约、接单与分成口径而不重复形成现金收入。每个服务实例最多关联一条核销流水。

`service.redemption.read` 允许读取核销任务；`service.redemption.manage` 允许管理 Entity 改派、处理取消申请和确认完成。完成动作与流水创建在同一事务中；团队缺少有效 Transaction Ability 时只完成服务，不创建或后补流水。
