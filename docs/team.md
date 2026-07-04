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
获取自己在团队内的完整资料（含 profile + 岗位 + custom_fields + custom_field_values）
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

### [controller] memberField
<!-- 成员字段定义和值管理；字段定义属 Team 级配置，字段值属 TeamMember -->
+ index
获取全部成员字段定义，支持 keyword、source 筛选
+ get
获取单个成员字段定义
+ add
新增成员字段定义
+ edit
编辑成员字段定义
+ delete
删除成员字段定义
+ values
获取某个成员的字段值，需传 member_id
+ saveValues
保存某个成员的字段值，需传 member_id，values 使用 field_id => value

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

### [controller] doc
<!-- 团队文档能力。控制器在 team 应用内，文档能力校验下沉到 app\service\Document -->
+ index (`GET /doc`)
获取团队或成员文档列表，支持 page、limit、target_type、target_id、manager_scope、visibility、keyword
+ get (`GET /doc/get?id={id}`)
获取单篇文档，兼容旧路径 `GET /doc/{id}`
+ create (`POST /doc/create`)
新增文档
+ edit (`POST /doc/edit`)
编辑文档
+ delete (`POST /doc/delete`)
删除文档

## Controller 写法约定

+ 控制器放在 `app/team/controller`，类名不加 `Controller` 后缀，如 `Member`、`PostType`、`MemberField`
+ 路由沿用动作式命名：`index/get/add/edit/delete`；特殊业务动作使用清晰动词，如 `block`、`unblock`、`saveValues`
+ 控制器只负责取参、调用 service、返回响应，不写业务逻辑
+ service 通过容器获取：`app(\app\service\Xxx::class)`，不直接 `new`
+ 返回统一使用 `success()` 或 `message()`，不直接 `json()`
+ 入参不在 controller 做重复类型转换，模型已有 `$type` 时交给模型处理；controller 只保留必要的 ID 提取

