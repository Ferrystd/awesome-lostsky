# Common 应用

Common 仅承载团队文件上传入口。顾客端必须发送 `X-LostSky-App: common` 显式选择应用；`AppResolver` 不允许该请求头选择其他应用，团队上下文仍从标准 Host、可信前端 Origin 或自定义域名解析。

资源附件上传依次经过 `JwtAuth → Context → EntityType → TeamWorkspaceAuth`，接受四类实体 JWT；本团队实体可用，外部实体还必须在目标团队绑定至少一个角色。上传文件先进入 12 小时待使用状态，不计文件额度、不出现在后台文件库；只有获授权业务成功保存真实图片、附件或 Markdown 节点时，才在同一事务中校验 File 容量并激活。过期引用被拒绝，`system:cleanup` 自动删除未使用记录并重试 OSS 物理清理。上传时校验文件规则，未购买升级时使用 0 级 128 MiB，资料/商品/文档等保存接口继续校验对应资源的编辑权限。团队文件库上传改由 Team `/file/upload` 承担，并额外要求 `file.upload`。Common 上传始终关联当前 `entity`；系统、加入申请等无实体文件由服务内部入口写入 `NULL`，不经过此公共路由。客户端只能声明 `attachment` 或 `markdown` 来源，不能据此取得权限或改变审计归因。文件由统一验证器限制为最多 50 MiB，并只接受 `config/file.php` 中的扩展名白名单；OSS 使用本地文件流上传。

接口契约见 [`common.openapi.json`](../openapi/common.openapi.json)。

个人工作台、顾客资料、加入申请上传同样待使用；只有带 `file.upload` 权限的 Team `/file/upload` 文件库入口立即生效。CLI 与系统内部上传维持受信任直接生效。既有文件保持生效；客户端 `source` 不影响生命周期。
