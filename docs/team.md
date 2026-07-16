# team

## RBAC 角色管理
<!-- 仅团队创建者可管理；统一使用 JwtAuth + Context + TeamAccess，不使用普通 RBAC 权限 key。 -->

### [controller] role - 团队角色
+ index (`GET /role/index`)
获取当前团队的角色列表，按 `sort`、`id` 升序排列。
+ get (`GET /role/get?id={id}`)
获取当前团队的单个角色。
+ add (`POST /role/add`)
创建角色，提交 `role_key`、`name`、`description`、`sort`；已软删除的同标识角色会被恢复。
+ edit (`POST /role/edit`)
编辑角色的 `name`、`description`、`sort`，不允许修改 `role_key`。
+ delete (`POST /role/delete`)
软删除角色，并在同一事务内软删除角色权限和成员角色绑定。

### [controller] rolePermission - 角色权限
+ index (`GET /rolePermission/index?role_id={role_id}`)
获取指定角色的全部权限。
+ save (`POST /rolePermission/save`)
通过 `role_id`、`permission_keys` 全量同步角色权限；空数组表示清空权限。

### [controller] memberRole - 成员角色
+ index (`GET /memberRole/index?member_id={member_id}`)
获取指定成员的全部角色绑定，结果包含角色信息。
+ save (`POST /memberRole/save`)
通过 `member_id`、`role_ids` 全量同步成员角色；空数组表示清空角色。
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

# 加入申请与审核

用户申请加入团队时先提交 `join/form` 返回的申请表单字段。申请字段独立于 `TeamMemberField`，但可以通过 `is_transfer_member_field=1` 和 `member_field_id` 指定同意加入后自动转存到 `TeamMemberFieldValue`。

状态枚举：

- `1` 已申请
- `2` 审核中
- `3` 已取消
- `4` 已加入
- `5` 已拒绝

申请人接口：

- `GET /join/form`：获取可填写的加入申请表单字段。需要 JWT，且当前用户不是该团队成员。
- `POST /join/apply`：提交加入申请，`values` 支持用 `field_id` 或 `field_key` 作为键。
- `GET /join/mine`：查看自己的申请记录。
- `GET /join/get?id=`：查看自己的单个申请详情。
- `POST /join/cancel`：取消自己的待处理申请。
- `POST /join/upload`：申请阶段上传文件，文件记录的 `member_id` 为 `NULL`。

管理员接口：

- `GET /joinReview/index`：申请列表，可按 `status`、`user_id` 筛选。
- `GET /joinReview/get?id=`：申请详情。
- `POST /joinReview/review`：进入审核中。
- `POST /joinReview/saveTasks`：设置一组审核任务，任务只有管理员可编辑。
- `POST /joinReview/setTaskPassed`：更新某个审核任务是否通过。
- `POST /joinReview/approve`：同意申请，创建成员并转存字段值。
- `POST /joinReview/reject`：拒绝申请。
- `GET /joinField/index`、`POST /joinField/add|edit|delete`：配置申请加入表单字段。
