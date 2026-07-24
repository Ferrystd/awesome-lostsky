# Transaction 应用

Transaction 负责团队记账流水、客户与发单人的绑定关系，以及顾客预存款管理。

## 业务职责

- 查询、创建、编辑和删除流水。
- 查询当前团队的成员、客户及余额，作为流水、绑定和充值表单的统一选项来源。
- 按汇总、角色、成员、时间或客户生成统计结果。
- 查询当前成员或全团队的客户绑定关系，并由管理员维护绑定。
- 查询顾客余额日志并执行充值。

流水编辑不允许更换 `handler_id`；涉及余额和多模型变更的操作由服务层事务保证一致性。
预存款支付必须关联本团队客户，接单人、发单人和客服必须为本团队成员；所有金额均为非负有限数值。

## 鉴权边界

所有接口都经过 `JwtAuth`、`Context`、允许四种团队实体的 `EntityType`、`TeamBelongs`
和 `MemberAccess`；实体类型与归属先确定请求主体，成员及业务权限中间件再取交集。

- 流水创建和编辑还要求 `TransactionAbility` 与 `TransactionVerify`。
- 流水删除要求 `TransactionAbility` 与 `TransactionAccess`。
- 统计要求 `TransactionAbility`。
- 全团队绑定查询、绑定和解绑要求 `TeamAccess`；当前成员的绑定列表不要求管理身份。
- 充值同时要求 `TransactionAbility` 与 `TeamAccess`。

## 接口契约

具体路径、筛选参数、统计类型和响应结构见 [`transaction.openapi.json`](../openapi/transaction.openapi.json)。

后端回归测试使用项目 `.env` 指向的 MySQL 数据库，并自动回滚或清理隔离测试数据：

```bash
npm run test:backend
```
