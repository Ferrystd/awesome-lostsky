# 后端约定

## 分层

- 路由显式写在 `app/{app}/route/app.php`，参数与控制器、OpenAPI 一致。
- 控制器只处理输入、调用服务并返回响应；业务规则在服务或模型中。
- 服务通过容器解析，验证失败返回 HTTP 422；跨模型写入使用短事务。
- 业务模型继承 `app\model\Base`；类名不附加 `Service`、`Controller`、`Validate`。
- 响应使用 `{code, message, data}`，列表使用 `{total, list, page, limit}`；部分更新不得覆盖未提交字段。

## 去重与公共入口

优化以减少重复维护、保持可读性和既有行为为目标。先比较调用方的输入、输出、空值、错误和副作用，再抽取语义相同的部分；不为减少行数压缩语句、删除边界检查，或把权限、查询、审计和事务差异塞进通用函数的开关参数。

| 场景 | 现有入口 | 使用边界 |
| --- | --- | --- |
| 模型通用字段类型 | `Base::COMMON_TYPES` | 在模型 `$type` 中以业务字段数组 `+ self::COMMON_TYPES` 显式复用，左侧业务声明优先；只用于原本具有这些字段及相同转换的模型，不改变隐藏字段、JSON、枚举、时间戳与可空值规则。 |
| 模型团队与人员关系 | `concern\BelongsToTeam`、`concern\BelongsToEntity` | 分别提供原名 `team()`、`subject()`，只接入原本具有相同关系的模型；不放入 Base 为所有模型新增关系。ThinkPHP 会从调用方法推导关系名，关系方法应直接调用 ORM，不再套改名的通用转发函数。 |
| 分页返回结构 | `Pagination::response($paginator, $list = null)` | 只组装 `total/list/page/limit`；`null` 使用分页器集合，显式 `[]` 必须保持空列表。查询范围、排序、权限与列表转换留在原调用方。 |
| 验证失败处理 | `Validation::check($validator, $data)` | 复用失败时抛 HTTP 422 与原错误信息的场景；验证器、scene、only 等由调用方先配置。不同错误码、批量错误或其他返回约定不强行迁入。 |
| CLI JSON 输出 | `CommandResult::write($output, $code, $message, $data)` | 统一编码与换行并返回传入的退出码；成功/失败判断、错误数据是否为 `null`、HTTP 错误信息与退出码仍由命令决定，不改变原 catch 范围。 |

重构前后使用同一组行为断言：模型覆盖字段转换与覆盖优先级；关系覆盖名称、键、预加载、缺失目标和软删除；分页覆盖空集合、显式空覆盖与顺序；校验覆盖场景和错误；CLI 比较精确输出与退出码。现有入口分别由 `tests/model_defaults.php`、`tests/model_relations.php`、`tests/service_helpers.php`、`tests/command_result.php` 保护，运行范围仍按测试须知选择。

新增或改变 Service public 方法后，从代码生成 Service 字典；不得手改生成文件。若当前任务明确排除文档，记录待同步的方法和命令，在后续获准的文档或集成任务补齐，不把字典过期当作代码回归，也不把未完成的字典检查称为通过。

## 请求参数边界

> **参数来源必须明确，类型只在边界转换一次。** 路径变量使用 `route()`，查询参数使用 `get()`，请求体使用 `post()`；控制器不得用 `param()` 混合多个来源。

- 使用 ThinkPHP Request 类型后缀完成基础转换：整数 `/d`、字符串 `/s`、布尔值 `/b`、数组 `/a`。例如 `$request->route('id/d')`、`$request->get('page/d', 1)`、`$request->post('enabled/b', false)`。
- 不要在支持类型后缀的 Request 取值外再写 `(int)`、`(string)`、`(bool)` 或 `(array)`。Header 不支持类型后缀；读取后先用 `is_scalar()` 检查，再在请求边界转换。
- `AppResolver`、`Context`、JWT 等生产端负责首次构造 `team_id`、`user_id`、`entity_id` 与 `acting_entity`。控制器、服务和后续中间件直接消费，不重复强转。
- 通用基础设施确需接受多个来源时，应逐一读取 route、query、body，声明优先级并拒绝冲突值。仅用于请求指纹等不产生业务参数语义的场景，才可保留 `param()`。
- ORM 字段、枚举、金额、序列化结果和外部 SDK 数据位于其他边界，仍按各自契约转换。

## 数据

- 团队数据始终限定 `team_id`，业务资源关联 ID 同时校验团队归属。订单和流水的接单人、发单人、客服是人员引用例外：只校验实体存在且有效，允许跨团队合作，不扩大顾客、商品、余额或授权范围；已配置接单池仍校验资格。
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
