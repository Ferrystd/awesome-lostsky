# Context

## 定义

Context 是认证完成后，根据当前 Entity 写入请求的可信业务上下文。

## 使用场景

它补充当前团队、成员或客户等业务身份，供权限、访问和领域服务消费；它不把真实 `user` 自动当作业务主体。

## 调用参数

`Context` 没有可配置的中间件参数，路由中直接写 `Context`，不使用 `Context:...`。它依赖前置中间件已经写入以下请求属性：

| 请求属性 | 来源 | 必需 | 用途 |
| --- | --- | --- | --- |
| `jwt` | `JwtAuth` | 是 | 从 `jwt.uid` 取得真实登录用户 ID。 |
| `entity_session` | `JwtAuth` | 否 | 实体身份 Token 对应的有效会话；存在时用其 `subject` 建立当前 acting entity。 |
| `team` | `AppResolver` | 否 | 当前路由解析出的团队；存在时补充团队以及团队内成员或客户上下文。 |

## 写入的请求属性

| 请求属性 | 类型 | 写入条件与含义 |
| --- | --- | --- |
| `authenticated_user_id` | `int` | 始终写入，是真实登录用户 ID，用于认证与审计。 |
| `user_id` | `int` | 始终写入，与 `authenticated_user_id` 相同，供明确的 user 层流程使用。 |
| `acting_entity` | `array{entity_id:int,type:string,id:int}` | 存在有效 `entity_session` 时写入；`entity_id` 是全局 Entity ID，`type` 和 `id` 标识其底层实体。 |
| `entity_id` | `int` | 存在有效 `entity_session` 时写入，等于 `acting_entity.entity_id`。 |
| `team_id` | `int` | 已解析出 `team` 时写入。 |
| `member` / `member_id` | `TeamMember` / `int` | acting entity 是当前团队内有效的 `teamMember` 时写入。 |
| `customer` / `customer_id` | `TeamCustomer` / `int` | acting entity 是当前团队内有效的 `teamCustomer` 时写入；`customer` 同时预载 `profile` 与 `balance`。 |

`team` 和 `teamVirtual` 类型不会额外生成专属请求属性，统一通过 `acting_entity` / `entity_id` 消费。没有实体会话时，也不会从真实 user 的关联关系推断 `member` 或 `customer`。若实体会话存在但找不到对应 subject，`Context` 返回 `401`；其余实体类型、团队归属和权限检查交给后续中间件。

## 相关概念

- [Entity](entity.md)是 Context 的身份来源。
- [团队成员](team-member.md)与[团队客户](team-customer.md)是可能写入 Context 的业务身份。

## 来源与示例

边界见[实体身份与跨团队委托](../architecture/entity-authorization.md)，中间件实现位于 `app/middleware/Context.php`。例如，客户实体发起订单时，订单逻辑读取当前客户 Context，而非从 user 关联关系回退推断客户。
