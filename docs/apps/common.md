# Common 应用

Common 仅承载团队文件上传入口。客户端必须发送 `X-LostSky-App: common` 显式选择应用；`AppResolver` 不允许该请求头选择其他应用，团队上下文仍从标准 Host、可信前端 Origin 或自定义域名解析。

资源附件上传依次经过 `JwtAuth → Context → TeamAuth`，接受本团队四类有效实体；它只校验 File 等级容量和文件规则，未购买升级时使用 0 级 128 MiB，资料/商品/文档等保存接口继续校验对应资源的编辑权限。团队文件库上传改由 Team `/file/upload` 承担，并额外要求 `file.upload`。文件通过 `file.entity_id` 关联当前 `entity`，无实体的系统或加入申请上传保持 `NULL`。文件由统一验证器限制为最多 50 MiB，并只接受 `config/file.php` 中的扩展名白名单；OSS 使用本地文件流上传。

接口契约见 [`common.openapi.json`](../openapi/common.openapi.json)。
