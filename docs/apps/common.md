# Common 应用

Common 仅承载团队文件上传入口。客户端必须发送 `X-LostSky-App: common` 显式选择应用；`AppResolver` 不允许该请求头选择其他应用，团队上下文仍从标准 Host、可信前端 Origin 或自定义域名解析。

上传依次经过 `JwtAuth → Context → TeamAuth → Permission:file.upload`，接受本团队四类有效实体。文件通过 `file.entity_id` 关联当前 `entity`，无实体的系统或加入申请上传保持 `NULL`。文件由统一验证器限制为最多 50 MiB，并只接受 `config/file.php` 中的扩展名白名单；OSS 使用本地文件流上传。

接口契约见 [`common.openapi.json`](../openapi/common.openapi.json)。
