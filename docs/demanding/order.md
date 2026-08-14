## 解决方案

1.
由于：可能未开通Shop Ability，或不需要商店功能，仍需要发单人赋予客户权益。同时权益关联商品的相关资源需要在Shop管理
方案：
+ 将Ability校验仅限于开启shop.enabled。未开通Ability也能在后台进行商品操作
+ 手动赋予的权益不产生Shop的订单，与其脱钩。发单人在Transaction应用下赋予客户不与订单挂钩的独立权益(而不是Shop应用)
+ 确定方法论：Ability鉴权边界应当最小化

2.
由于：后台发单人手动赋予权益（这个权益来源一定是从Shop的商品）不确定是否需要流水功能。

方案：将发单人手动赋予权益是否自动写入流水新增一个TeamSetting。类似于shop.sync_transaction。
