# trade
<!-- 购买、卡密、资产管理 -->

## [controller] store -商店
<!-- 套餐浏览、直接购买、购买卡密 -->
+ index
商品列表/套餐浏览
+ buy
直接下单购买套餐
+ card
购买卡密（选择面额数量）

## [controller] redeem -卡密兑换
<!-- 用户输入卡号+密钥进行核销 -->
+ index
卡密核销提交
+ verify
仅校验卡密有效性（不消费）

## /asset -资产管理
<!-- 名下所有权益与卡密 -->
### [controller] subscription -订阅管理
+ index
查看所有有效订阅列表
+ detail
查看某个订阅详情（剩余时长、配额）

### [controller] card -我的卡密
+ index
我持有的未使用卡密列表
+ detail
卡密详情（面额、类型、有效期）

## /order -订单
### [controller] order -订单记录
+ index
订单列表
+ detail
订单详情
+ pay
继续支付未完成订单
+ cancel
取消待支付订单
