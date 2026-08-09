# Shop 应用

Shop 同时承载团队的展示型商城和既有商家管理接口。访客通过
`https://{slug}.shop.lostsky.work` 浏览上架商品；客户绑定后使用商家预存余额直接购买。
第一版不提供购物车、在线充值或第三方支付。

`/manage` 是 Shop 应用内的独立浅色后台，复用 LostSky 后台组件和权限语义，不改变公开商城的深色展示结构。它提供商品、订单、服务定义、服务权益包、卡活动、兑换码与商品核销字段管理。

管理接口统一位于 `/manage/*`，使用 TeamAuth，并复用 `shop.product.read/write/delete` 与 `shop.order.read/write`。服务、权益包和活动按当前团队隔离；兑换码列表不输出哈希、密文或明文，明文只能通过发行结果或显式查看接口获得。

## 业务职责

- 商品：列表、详情、创建、编辑、删除和接单人配置；商品封面与详情图片复用 Common 文件上传。
- 订单：列表、详情、创建、取消和完成，并由服务层处理相关交易与余额联动。
- Storefront：公开团队资料、上架商品列表和脱敏后的商品详情。
- 顾客业务：绑定当前商家的稳定客户身份，在商城客户中心维护资料、查询余额、订单、服务与卡密，并购买或取消自己的订单。
- 个人工作台：Team、成员和虚拟实体管理 `team_product.entity_id` 归属当前 Entity 的本人商品，并查看当前 Entity 作为接单人或发单人参与的业务订单；不引入新的商品归属字段。
- 团队工作台：所有后台 Entity 都可进入基础团队概览；商品、订单、服务、权益包和卡活动按 Permission 禁用并说明原因。顶栏直显四应用入口，个人模式由概览“进入个人工作台”进入并从顶栏“商品”返回。

## 鉴权边界

`GET /storefront*` 无需登录，团队由 `{slug}.shop.lostsky.work` 的请求上下文确定。商品与商家订单入口要求四种团队实体 JWT，并经过
`TeamAuth`。`POST /customer/bind` 接受基础 User JWT 或任意有效 acting Entity，不使用
`TeamAuth`；其余客户接口只接受属于当前团队的 `teamCustomer`。

| 领域 | 基础身份 | 额外限制 |
|---|---|---|
| 团队商品 | 四类团队实体 | 读取、写入和删除分别使用 `shop.product.read`、`shop.product.write`、`shop.product.delete` 权限 |
| 本人商品 | Team、成员或虚拟实体 | `shop.product.self.manage`；所有读取和写入同时按团队与当前 `acting_entity.entity_id` 隔离 |
| 订单 | 四类团队实体 | 读取要求 `shop.order.read`；创建、取消和完成要求 `shop.order.write`，创建另经过 `TransactionVerify` |
| Storefront | 无 | 仅返回上架商品和公开 DTO，不返回成本、分成或内部接单配置 |
| 客户绑定 | 基础 User 或任意有效 Entity | 一个来源在同一商家只能绑定一个客户；绑定不可转移 |
| 顾客中心 | `CustomerAccess` | 只能访问并维护当前商家的客户资料、余额和订单；购买参数不接受客户端价格与分成 |

跨模型的订单、流水和余额变更由服务层在事务中完成，控制器不负责数据联动。
本人商品接口统一位于 `/personal/products*`。创建时服务端强制写入当前 Entity，编辑、上下架、接单人和核销字段操作不允许转移归属，也不提供本人商品硬删除；访问团队公用或他人商品统一返回 `404`。每个写请求都必须提交 `expected_entity_id`，身份切换导致预期 Entity 与 JWT 叶子 Entity 不一致时返回 `409` 且不修改数据。候选接口只提供商品表单所需的有效人员 Entity、启用权益包和卡活动，本人商品管理不能维护这些团队级定义。
团队设置 `shop.sync_transaction` 默认开启；只有设置开启且团队具有等级不低于 1、未过期的 `transaction` Ability 时，新订单才自动生成关联流水。未同步流水不阻止订单创建，预存款扣减、余额日志与取消退款照常执行，订单和余额日志的 `trans_id` 保持 `null`。
有 `customer_id` 的订单使用客户预存款支付；无客户订单使用现金支付。商品默认分成是单件值并随数量缩放，显式订单分成是整单值；未显式给出团队分成时由总价减成本和其他分成后的余额补齐。

团队商品和本人商品表单都允许直接上传封面与 Markdown 详情图片。资源附件统一调用 Common `/upload`，只要求团队 File Ability；商品保存继续由对应商品管理 Permission 校验，不额外要求 `file.upload`。缺少能力时保留 URL 输入，只禁用本地文件选择并说明具体原因。

客户绑定同时创建零余额记录和不可搜索的 `teamCustomer` Entity。基础用户绑定保存在
`user_id`，外部 Entity 绑定保存在 `owner_entity_id`，两者严格二选一。派生客户会话沿来源
Entity 的证明链实时重验；来源失效、会话撤销或客户封禁后立即失效。

`GET /customer/me`、`POST /customer/me` 与 `POST /customer/slug` 是商城客户中心的正式资料接口。Account 旧客户自管深链会安全跳转 `/customer/profile`。客户资料仍按团队隔离，昵称和简介不进入公开目录；新绑定客户自动得到 slug，历史缺失标识可在商城客户中心首次补全。

客户下单在事务中锁定并复核商品、接单人和余额，金额全部由服务端计算。取消只允许订单所属
客户操作处理中的订单；订单保留为“已取消”，关联交易被排除，预存余额和退款日志只写一次。

## 接口契约

具体路径、筛选参数和响应结构见 [`shop.openapi.json`](../openapi/shop.openapi.json)。

## 权益与核销字段

商品可关联复用权益套餐，并声明普通商品、Ability 权益或次数服务包。订单完成时由统一履约服务幂等交付；服务实例始终归购买 Customer 的根 Entity。商品核销字段复用实体字段的类型与值校验，并增加填写阶段、Customer 可见性和必填规则；已保存的实例字段值独立保留。

Customer API 提供服务列表、详情、接单池、发起核销、申请取消，以及持有卡密的查询、领取和明文揭示。完整用户流程与边界见[卡密、Ability 与服务核销](../manual/service-redemption.md)。
