---
title: 通过 Standard Webhooks 接入自定义工作流
tags:
  - 集成
description: 与自有系统的深度集成
audience:
  - team-admin
aliases:
reviewed_at:
---
接入流程：**LostSky 向你的 HTTPS 接口推送事件 → 你的系统验签并处理 → 按需调用 API 回复。**

事件签名遵循 [Standard Webhooks]。

## 1. 新建集成

1. 在需要建立事件回调的机器人下新建集成。
2. 填入你的公网 HTTPS 接收地址，并选择需要订阅的事件。
3. 记录以下配置，其中 `slug` 是团队标识：

| 配置                  | 值                                      |
| ------------------- | -------------------------------------- |
| `CHAT_API_BASE`     | `https://<slug>.chat.api.lostsky.work` |
| `WEBHOOK_SECRET`    | 创建集成后返回                                |
| `INTEGRATION_TOKEN` | 创建集成后返回                                |

## 2. 接收并验签

LostSky 使用 `POST` 向接收地址发送 JSON，并附带以下请求头：

| 请求头                 | 内容                   |
| ------------------- | -------------------- |
| `webhook-id`        | 本次投递的唯一 ID；重试时保持不变   |
| `webhook-timestamp` | 本次发送时间的 Unix 秒时间戳    |
| `webhook-signature` | Standard Webhooks 签名 |

使用 `WEBHOOK_SECRET` 和 Standard Webhooks SDK 验签。验签时必须传入未经解析或重新编码的原始请求体以及上述请求头。

## 3. 事件格式

验签后的 JSON 包含 `type`、`timestamp` 和 `data`。`type` 决定 `data` 的结构；`timestamp` 是事件发生时间，采用 UTC RFC 3339 格式。

| 事件                                                    | `data` 的结构                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `conversation.created`                                | `{ "conversation": "会话 UUID", "kind": "direct 或 group" }`    |
| `conversation.closed`                                 | `{ "conversation": "会话 UUID" }`                              |
| `conversation.participants.added`                     | `{ "conversation": "会话 UUID", "participants": [实体摘要, ...] }` |
| `conversation.participant.removed`                    | `{ "conversation": "会话 UUID", "participant": 实体摘要 }`         |
| `message.created`、`message.updated`、`message.revoked` | 消息摘要                                                         |

实体摘要用于参与者和消息发送者：

| 字段             | 类型             | 内容                                     |
| -------------- | -------------- | -------------------------------------- |
| `type`         | 字符串            | `entity`、`customer`、`team` 或 `virtual` |
| `slug`         | 字符串或 `null`    | 实体的 Slug；实体失效时可能为空                     |
| `name`         | 字符串            | 显示名称                                   |
| `avatar`       | 字符串或 `null`    | 头像地址                                   |
| `status_code`  | 字符串或 `null`，可选 | 团队成员的状态代码                              |
| `status_label` | 字符串或 `null`，可选 | 团队成员的状态名称                              |
| `is_valid`     | 布尔值，可选         | 实体当前是否有效                               |

消息摘要用于三种消息事件：

| 字段             | 类型          | 内容               |
| -------------- | ----------- | ---------------- |
| `id`           | 整数          | 消息 ID            |
| `conversation` | 字符串         | 会话 UUID          |
| `sender`       | 对象          | 实体摘要             |
| `content`      | 字符串或 `null` | 消息内容；撤回后为 `null` |
| `reply_id`     | 整数或 `null`  | 被引用的消息 ID        |
| `edited_at`    | 整数或 `null`  | 编辑时间，Unix 秒时间戳   |
| `revoked_at`   | 整数或 `null`  | 撤回时间，Unix 秒时间戳   |
| `create_time`  | 整数          | 创建时间，Unix 秒时间戳   |

接收端应忽略未列出的附加字段，以便兼容后续扩展。

## 4. 把处理结果发回会话

向 `{CHAT_API_BASE}/integration/message` 发送 `POST` 请求，并设置 `Authorization: Bearer {INTEGRATION_TOKEN}` 和 `Content-Type: application/json`。

| 请求字段           | 必填  | 内容                      |
| -------------- | --- | ----------------------- |
| `conversation` | 是   | 收到的 `data.conversation` |
| `content`      | 是   | 你的系统生成的回复文本             |
| `reply_id`     | 否   | 收到的 `data.id`；不引用原消息时省略 |

响应包含 `code`、`message` 和 `data`；成功时 `code` 为 `0`，`data` 是发送成功的消息摘要。只有 HTTP 请求成功且 `code` 为 `0` 才视为发送成功。

机器人只能向其已加入且允许发送的会话发消息。它通过本集成发出的消息不会再次推送给同一个集成，避免直接自循环。

## 5. 联调与上线

1. 在联调会话中人工发送一条消息，确认你的接口收到 `message.created` 并验签成功。
2. 用该事件的会话 ID 和消息 ID 调用回复接口，确认会话中出现机器人回复。
3. 重复处理同一 `webhook-id`，确认业务系统不会重复执行或回复。

接收端应在**可靠保存或入队后**返回 `204`，再异步执行耗时业务；保存失败返回 `5xx`。

LostSky 总请求超时为 10 秒。任意 `2xx` 都表示接收成功；其他状态或网络失败会重试，最多尝试 6 次，五次重试间隔为 15、45、135、405、1215 秒，实际时间受调度影响。事件可能重复或乱序。验签 SDK 的时间窗口检查不能替代业务去重；去重记录建议至少保留 24 小时，长时间故障时覆盖实际恢复周期。

| 遇到的问题    | 检查方式                                     |
| -------- | ---------------------------------------- |
| 收不到事件    | 请管理员检查订阅是否启用、机器人是否已加入会话；确认公网 HTTPS 地址可访问 |
| 验签失败     | 检查完整 `whsec_` 密钥、三个标准请求头、原始请求体及服务器时钟     |
| 回复返回 401 | 检查 API Token，不要误用签名密钥；确认凭据没有轮换           |
| 回复被拒绝    | 阅读响应 `message`；确认机器人仍在会话中、会话允许发消息        |
| 重复回复     | 按本接入与 `webhook-id` 原子去重，避免收到重试就再次处理      |
