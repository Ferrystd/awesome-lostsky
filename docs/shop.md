# shop
<!-- 商城应用：商品、订单、顾客自助中心 -->

## [controller] Product
<!-- 商品管理与展示，读操作需成员身份，写操作需 ShopAccess -->
+ index
获取商品列表，支持按成员、启用状态、关键词筛选
+ get
获取单个商品详情
+ create
新增商品，需 ShopAccess
+ edit
编辑商品，需 ShopAccess
+ delete
删除商品，需 ShopAccess
+ setHandlers
设置商品接单人，需 ShopAccess

## [controller] Order
<!-- 商城订单，创建需交易校验，取消/完成需 ShopAccess -->
+ index
获取订单列表，支持按客户、接单人、状态、时间筛选
+ get
获取单个订单详情
+ create
创建订单，需 TransactionVerify
+ cancel
取消订单，需 ShopAccess
+ complete
标记订单完成，需 ShopAccess

## [controller] Customer
<!-- 顾客自助中心：顾客只能查看自己在当前团队下的数据 -->
+ me
获取当前顾客资料（含 profile + balance）
+ orders
获取当前顾客的订单列表，支持状态和时间筛选
+ transactions
获取当前顾客的交易流水，支持类型和时间筛选
+ balance
获取当前顾客预存款余额
+ balanceLogs
获取当前顾客余额变动日志

## middleware
+ JwtAuth
确认登录用户
+ Context
解析当前团队与用户上下文
+ MemberAccess
用于商品、订单的成员侧入口
+ ShopAccess
用于商品管理、订单取消/完成等团队管理操作
+ TransactionVerify
用于订单创建时校验交易能力和成员操作权限
+ CustomerAccess
用于顾客自助中心，按 `team_id + user_id` 识别当前顾客

## service
+ Product
商品列表、详情、创建、编辑、删除、接单人设置
+ Order
订单列表、详情、创建、取消、完成，并联动交易流水与客户余额
+ TeamCustomer
顾客自助查看资料、订单、流水、余额和余额日志
