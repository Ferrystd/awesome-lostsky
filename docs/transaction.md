# transaction
<!-- 记账流水 -->

## [controller] Transaction
+ index
获取流水列表，支持按日期/类型/角色/客户筛选
+ get
获取单条流水详情
+ create
新建流水，需 TransactionAbility + TransactionVerify 权限
+ edit
编辑流水，不允许修改 handler_id
+ delete
删除流水，仅团队所有者
+ stats
多维统计（汇总/按角色/按成员/按时间/按客户）

## [controller] Sender
<!-- 客户与发单人绑定 -->
+ index
获取当前成员的绑定客户列表
+ all
获取全团队的绑定关系列表，需 TeamAccess
+ bind
绑定客户到发单人，需 TeamAccess
+ unbind
解绑，需 TeamAccess

## [controller] Balance
<!-- 预存款管理 -->
+ logs
获取某客户的余额变动日志
+ recharge
客户充值，需 TransactionAbility + TeamAccess
