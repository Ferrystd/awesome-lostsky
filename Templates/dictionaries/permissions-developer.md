# 权限字典

<!-- 由 php think docs:permissions 生成；编辑 Templates/dictionaries/permissions-developer.md。 -->

团队权限以 [`PermissionDictionary`](../../app/service/PermissionDictionary.php) 为唯一代码事实源。
角色权限保存为 `team_role_permission.permission_key`，同一实体绑定多个角色时取权限并集。服务端保存所有不同且合法的键，不折叠父子或通配符与指定 slug；官方角色编辑器只在提交权限时生成最小集合，权限摘要则逐条展示存储记录。
`GET /rolePermission/catalog` 向管理端返回同一字典及当前团队的动态虚拟实体项，并通过必返的 `advanced_items` 列出所有可保存父键、当前覆盖的叶子键和范围文案。身份领取归入“实体委托”，虚拟实体维护归入“实体管理”，仅限聊天的代操作归入“聊天”；高级目录由固定权限与当前团队动态权限的所有合法前缀生成并去重。

## 固定权限

{{permissions.team}}

## 动态权限

{{permissions.dynamic}}

动态权限保存时会校验目标实体属于当前授权团队。`*` 权限只覆盖当前团队，不扩散到其他团队；Permission 不支持 deny，多个候选权限按 OR 判断。父键自动覆盖其下所有子键，例如 `team` 和 `team.ability` 都可满足 `team.ability.redeem`，但不会覆盖兄弟键；保存后的父键不展开，并会自动包含未来新增的同前缀子权限。父键仍须是权限目录中已有键的前缀，动态键父级继续校验对应实体属于当前团队，未知前缀与跨团队精确目标均拒绝保存。

服务端兼容父键与子键、`*` 与指定 slug 同时存储，不在写入或读取时清理这些覆盖冗余。官方前端在用户保存角色权限时统一移除已被更宽权限覆盖的键；仅查看角色或有效权限不会触发清理。

开发期升级补丁会把旧虚拟实体、字段和 `identity.virtual.*.act` 键迁移到当前命名并删除旧键。新的 `chat` 父权限只覆盖聊天能力；`identity.virtual.*.act` 不作为运行时别名。

`team.entity.read`、`team.member.read`、`team.document.read` 和 `team.customer.read` 表示“全量读取”，不是基础入口许可。没有顾客全量读取权限时，当前归属实体仍可查看自己的顾客；Customer 在通用实体目录中始终需要 `team.entity.read`，对无权 Customer 与团队内隐藏实体的直接访问返回 404；文档继续按自身可见性返回。文档管理 Permission 只把持有者认定为对应归属实体的文档管理员，允许读取该实体全部文档并按 `manager_scope` 写入；归属实体本人仍只管理 `SubjectTeam` 文档。`team.customer.manage` 同时授予顾客全量读取，并控制资料、归属与封禁更新；顾客本人在 Shop 只可修改自己的资料和归属，不因此获得后台管理权限。

Permission 按“目标团队 + 当前全局有效 Entity”计算，不要求 Entity 归属于目标团队。团队范围先由 `TeamWorkspaceAuth` 检查至少一个目标团队角色，再由具体接口检查 Permission；个人、自助、成员本人和 Chat 继续使用 `TeamAuth`。微博的基础概览与访问快照无业务 Permission，团队业务统一要求 `weibo.team.manage`，个人业务统一要求 `weibo.personal.use`；只有远端操作和任务启动、恢复再叠加 Weibo Ability，且 Permission 先于 Ability 返回失败。

权限拒绝使用结构化错误：`data.kind=permission` 且 `data.required_any` 列出任一可满足的 Permission；能力拒绝使用 `data.kind=ability` 并返回能力键、标签、最低等级和缺失原因。前端由 `@lostsky/api/error-format` 读取结构化数据，并通过 `@lostsky/api/error-messages` 的默认模板或按键覆盖生成提示；单一 Permission 和 Ability 可按原始键覆盖，多个候选 Permission 始终使用默认模板并以 ` / ` 连接。结构化数据不完整时保留服务端原始文案。

`team.member.remove` 允许管理员直接办理成员离职，不创建待审申请；成员自助离队不依赖该 Permission，但只允许正常成员本人使用直接领取的根身份会话。自助申请仍受 `member.departure_mode` 控制并可进入审核；复职继续复用 `team.join_review.read/write`，不新增独立复职 Permission。非正常成员 Entity 是否具备业务可用性由 `member.inactive_entity_available` 动态决定，assume Permission 只决定谁可以代入，不覆盖 Entity 可用性。

## 平台权限

Admin 平台权限与团队权限共用 `PermissionDictionary` 作为代码事实源，但分别由 `adminGroups()`、`adminKeys()` 暴露，绝不进入团队角色目录。平台角色保存于 `platform_admin_role`，角色权限保存于 `platform_admin_role_permission`，用户与多个角色的绑定保存于 `platform_admin_user_role`；有效权限取角色并集。

{{permissions.admin}}

`super_admin` 系统角色始终拥有 `adminKeys()` 的全部权限；自定义角色按存储的权限键计算并集。平台权限不支持 deny，也不能通过团队角色获得。

## 维护规则

- 新增受保护能力时，先在 `PermissionDictionary` 增加常量、分组和文案，再由业务代码引用常量。
- 固定 key 或动态 key 族未进入字典时，运行时配置与角色权限保存都会拒绝。
- 只为已有业务入口增加权限；尚未实现的顾客删除/导出、文件分享和交易分类不预留空 key。
- 同步更新受影响的 OpenAPI、测试、字典模板和 Changelog，并运行 `php think docs:permissions`。
