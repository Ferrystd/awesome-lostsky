# 虚拟实体 Webhook

协议采用 [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md) 的 HMAC-SHA256 `v1` 方案。签名算法及各语言库以上游为准；本文只定义 LostSky 业务契约。首次接入见 [最小 SDK 示例](webhook-quickstart.md)。

## 请求与凭据

服务端向配置的公网 HTTPS 地址 POST JSON，并发送 `Content-Type: application/json`、`webhook-id`、`webhook-timestamp`、`webhook-signature`。集成创建或更新时，地址必须使用 HTTPS、可解析到公网 IP；内网、保留地址和无法解析的域名会被拒绝。密钥为 32 字节随机值的标准 Base64 编码，带 `whsec_` 前缀。签名内容为 `id.timestamp.原始请求体`，结果为 `v1,<Base64 HMAC-SHA256>`。

`webhook-id` 是投递记录 ID 的十进制字符串，在重试之间不变；每次尝试重新生成 Unix 秒时间戳和签名。接收端按集成与该 ID 原子去重，不应将其转换为 JavaScript Number。建议验签时间窗口为正负 5 分钟；业务去重记录至少保留 24 小时，长时间故障时应覆盖实际恢复周期。时间窗口与去重是两种独立检查。

签名密钥只用于验证出站事件，API Token 只用于调用入站 API。创建、轮换时明文返回一次，轮换立即替换两项凭据，不提供旧密钥过渡期。凭据不可写入日志。

## 事件信封

```json
{"type":"conversation.created","timestamp":"2026-09-08T00:00:00Z","data":{"conversation":"00000000-0000-4000-8000-000000000001","kind":"group"}}
```

`timestamp` 是事件创建时刻（UTC RFC 3339），不是本次重试时刻。`data` 是事件发生时保存的业务快照。忽略未知附加字段；不处理的事件可确认成功，避免无意义重试。

| type                               | data                                 |
| ---------------------------------- | ------------------------------------ |
| `conversation.created`             | `conversation` 会话 UUID、`kind` 会话类型   |
| `conversation.closed`              | `conversation` 会话 UUID               |
| `conversation.participants.added`  | `conversation`、`participants` 实体摘要数组 |
| `conversation.participant.removed` | `conversation`、`participant` 实体摘要    |
| `message.created`                  | 消息摘要                                 |
| `message.updated`                  | 消息摘要                                 |
| `message.revoked`                  | 消息摘要                                 |

消息摘要包含 `id`、`conversation`、`sender`、`content`、`reply_id`、`edited_at`、`revoked_at`、`create_time`，具体类型及实体摘要见 [Chat OpenAPI](../openapi/chat.openapi.json)。撤回内容以对应事件快照为准。

## 投递边界

按事件产生时的参与 Entity 确定接收范围，实际投递和重试时再次检查虚拟实体、集成及当前会话参与资格。参与者可以来自不同团队，投递记录归属于集成所属团队。集成发出的消息事件不会回投给该集成。内部接收者快照不属于对外事件正文。事件可能重复或乱序，不承诺恰好一次或永久必达。

任意 `2xx` 表示接收成功；非 `2xx`、超时及网络失败触发重试。连接超时 3 秒，总超时 10 秒，不跟随重定向。最多尝试 6 次，失败后的五次间隔依次为 15、45、135、405、1215 秒，实际时间受 worker 调度影响。达到上限后标记失败，不会自动恢复这条投递；需要重新触发业务事件时才会生成新的投递记录。

接收端应在可靠保存或入队后快速返回 `204`，异步处理业务；无法保存时返回 `5xx`。去重与业务写入需保证原子性，避免重复回复。

## 升级

本次为破坏式升级：删除旧自定义协议，不提供兼容请求头。先备份数据库并暂停 Chat outbox worker 和集成写入，核对待删除集成及关联投递的数量后执行 `sql/patches/20260908_standard_webhooks.sql`，再只读核对删除边界，部署新代码后恢复。补丁删除旧格式 Webhook 集成及关联投递（包括软删除数据），保留标准格式新集成，不重置 ID。

虚拟实体、会话、消息和共享 outbox 保留。因消息来源存在外键，旧集成对应的历史消息 `origin_integration_id` 置空，消息内容保留；原集成需重新创建并配置接收端。已发布 outbox 不会自动重放。数据删除不可通过回滚代码恢复。

## 固定签名测试向量

以下密钥仅用于公开测试，禁止用于真实集成。固定时间戳用于比较 `sign` 输出；实时 `verify` 会因过期而拒绝，这是预期行为。

```json
{
  "secret": "whsec_YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
  "id": "123",
  "timestamp": "1788825600",
  "body": "{\"type\":\"conversation.closed\",\"timestamp\":\"2026-09-08T00:00:00Z\",\"data\":{\"conversation\":\"00000000-0000-4000-8000-000000000001\"}}",
  "signature": "v1,EihjubRk9fdnGH/UCZhFHJh8e4cztc2BUBCTL1Bfh08="
}
```
