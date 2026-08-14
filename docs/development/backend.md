# 后端约定

## 分层

- 路由显式写在 `app/{app}/route/app.php`，参数与控制器、OpenAPI 一致。
- 控制器只处理输入、调用服务并返回响应；业务规则在服务或模型中。
- 服务通过容器解析，验证失败返回 HTTP 422；跨模型写入使用短事务。
- 业务模型继承 `app\model\Base`；类名不附加 `Service`、`Controller`、`Validate`。
- 响应使用 `{code, message, data}`，列表使用 `{total, list, page, limit}`；部分更新不得覆盖未提交字段。

## 请求参数边界

> **参数来源必须明确，类型只在边界转换一次。** 路径变量使用 `route()`，查询参数使用 `get()`，请求体使用 `post()`；控制器不得用 `param()` 混合多个来源。

- 使用 ThinkPHP Request 类型后缀完成基础转换：整数 `/d`、字符串 `/s`、布尔值 `/b`、数组 `/a`。例如 `$request->route('id/d')`、`$request->get('page/d', 1)`、`$request->post('enabled/b', false)`。
- 不要在支持类型后缀的 Request 取值外再写 `(int)`、`(string)`、`(bool)` 或 `(array)`。Header 不支持类型后缀；读取后先用 `is_scalar()` 检查，再在请求边界转换。
- `AppResolver`、`Context`、JWT 等生产端负责首次构造 `team_id`、`user_id`、`entity_id` 与 `acting_entity`。控制器、服务和后续中间件直接消费，不重复强转。
- 通用基础设施确需接受多个来源时，应逐一读取 route、query、body，声明优先级并拒绝冲突值。仅用于请求指纹等不产生业务参数语义的场景，才可保留 `param()`。
- ORM 字段、枚举、金额、序列化结果和外部 SDK 数据位于其他边界，仍按各自契约转换。

## 数据

- 团队数据始终限定 `team_id`，关联 ID 同时校验团队归属。
- 金额使用数据库精确计算，并以十进制字符串跨 API 传递。
- 枚举通过模型 `$type` 转换；缺失值使用 `NULL`，业务删除使用软删除。
- 唯一关系、余额、库存和状态迁移依靠约束、条件更新或事务内行锁保证并发正确性。
- 数据结构变化同步 `sql/schema.sql` 与日期补丁；执行前确认目标数据库，执行后只读验证。
- 当前项目仍处开发阶段，以当前数据与接口契约为准。明确删除的字段必须同时从 Schema、日期补丁、模型、服务、OpenAPI、生成类型和前端消费中移除；除非需求明确要求，否则不保留数据库影子列、请求别名或响应兼容字段。

## 安全与外部系统

- 密码只存哈希；refresh token 设备绑定、只存哈希并一次性轮换。
- 上传统一经过 `app\validate\File`，校验扩展名、大小、服务端 MIME 和配额。
- OSS、Webhook、支付等网络调用放在事务外，并提供幂等重试或补偿。
- 新增持久化能力时同时定义失效、清理、保留期和失败重试。
- `.env` 保存真实配置；`.env.example`、`deploy/` 和文档只保存公开模板。
