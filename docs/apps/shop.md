# Shop 应用

Shop 负责团队商品、订单以及顾客自助查询。成员侧管理与顾客侧查询使用不同的身份边界。

## 业务职责

- 商品：列表、详情、创建、编辑、删除和接单人配置。
- 订单：列表、详情、创建、取消和完成，并由服务层处理相关交易与余额联动。
- 顾客中心：当前顾客的资料、订单、交易流水、预存款余额和余额日志。

## 鉴权边界

所有入口都先经过 `JwtAuth` 和 `Context`。商品与订单入口接受四种团队实体 JWT，并经过
`TeamBelongs`；顾客中心只接受属于当前团队的 `teamCustomer`。

| 领域 | 基础身份 | 额外限制 |
|---|---|---|
| 商品 | `MemberAccess` | 读取、写入和删除分别使用 `shop.product.read`、`shop.product.write`、`shop.product.delete` 权限 |
| 订单 | `MemberAccess` | 创建经过 `TransactionVerify`；取消和完成经过 `ShopAccess` |
| 顾客中心 | `CustomerAccess` | 只能访问当前团队中由 `team_id + user_id` 识别出的顾客数据 |

跨模型的订单、流水和余额变更由服务层在事务中完成，控制器不负责数据联动。

## 接口契约

具体路径、筛选参数和响应结构见 [`shop.openapi.json`](../openapi/shop.openapi.json)。
