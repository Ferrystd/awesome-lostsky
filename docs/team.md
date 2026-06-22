# team
<!-- 团队信息 -->
## [controller] profile -个人资料
+ get
获取某团队(默认为本团队)的资料
+ edit
编辑本团队的资料

## /notice -站内信
### [controller] notice -站内信
+ index
获取全部站内信
+ get
获取单个站内信
+ confirm
确认某个站内信
+ confirmAll
确认全部站内信
+ receive
确认并且收取某个站内信的资产(不用实现)
+ receiveAll
确认并且收取全部站内信的资产(不用实现)
### [controller] settings -通知设置
<!-- 
目前支持：1~5级警告排序
微信/短信/邮件 发送通知告警
 -->
<!-- 暂时先不用实现 -->

### [controller] me
<!-- 自己操作自己，无需传 member_id -->
+ get
获取自己在团队内的完整资料（含 profile + 岗位）
+ edit
编辑自己的资料（仅 nickname、avatar）

### [controller] member
<!-- 管理员操作，需 TeamAccess -->
+ index
获取所有成员
+ get
获取单个成员（含 profile + 岗位）
+ add
添加成员（可同时设置 profile + 分配岗位）
+ edit
编辑成员 profile 及岗位
+ block
封禁成员
+ unblock
解封成员
+ remove
移出成员

### [controller] postType
<!-- 岗位类型定义，属 Team 级配置 -->
+ index
获取全部岗位类型
+ get
获取单个岗位类型
+ add
新增岗位类型
+ edit
编辑岗位类型
+ delete
删除岗位类型

