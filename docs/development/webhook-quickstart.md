# 将消息接入你的系统

本文面向外部系统开发者。你只需要提供一个 HTTPS 接口接收消息，再调用一个 HTTP API 发送回复，无需安装 LostSky、访问其代码或了解内部架构。

接入流程：**用户发消息 → 你的 HTTPS 接口收到事件 → 验签并交给你的业务系统 → 调用 API 回复。**

事件签名遵循 [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks)。可使用已有的标准验签 SDK，也可按标准自行实现；发送回复使用任意 HTTP 客户端。

## 1. 向接入提供方领取三项配置

将你的公网 HTTPS 接收地址（例如 `https://your-system.example/webhooks/messages`）交给 LostSky 管理员，并说明需要接收新消息事件 `message.created`。请管理员提供：

| 配置 | 用途 |
| --- | --- |
| `CHAT_API_BASE` | 完整 API 基础地址，由管理员提供，不需要你推导域名或团队标识 |
| `WEBHOOK_SECRET` | 以 `whsec_` 开头的完整签名密钥，用于验证收到的事件 |
| `INTEGRATION_TOKEN` | API Token，用于发送消息时的 Bearer 鉴权 |

请管理员将对应机器人加入用于联调的会话。本文中的“机器人”就是你接入后在会话中使用的发送身份。

将配置保存到你系统的环境变量或密钥管理服务。签名密钥与 API Token 不可互换，不要放入浏览器代码或日志；凭据轮换后需同时更新两项密钥。

## 2. 在你的系统增加接收接口

下面使用 Python、Flask 和官方 [standardwebhooks 库](https://github.com/standard-webhooks/standard-webhooks/tree/main/libraries/python)。在你的系统安装依赖：

```bash
python -m pip install standardwebhooks flask requests
```

将以下代码保存为 `app.py`，或将路由接入已有 Flask 应用：

```python
import os

from flask import Flask, request, Response
from standardwebhooks.webhooks import Webhook, WebhookVerificationError

app = Flask(__name__)
webhook = Webhook(os.environ["WEBHOOK_SECRET"])


@app.post("/webhooks/messages")
def receive_message():
    body = request.get_data()  # 原始 bytes，不要先解析 JSON
    try:
        event = webhook.verify(body, dict(request.headers))
    except (WebhookVerificationError, ValueError):
        return Response(status=400)

    # 最小联调：只验证并确认收到，不执行回复或持久化。
    # 生产接入：按集成 + request.headers["webhook-id"] 原子去重，
    # 可靠入队后再返回 204；入队失败返回 5xx，由 LostSky 重试。
    # 由异步 worker 处理 event。
    return Response(status=204)
```

配置好环境变量后，运行 `python -m flask --app app run --port 8000` 进行本地联调；将提供给管理员的公网 HTTPS 地址转发到 `/webhooks/messages`。生产环境请使用你系统的正式应用服务器部署，不使用 Flask 开发服务器。

必须传入原始请求体，不能先解析再重新编码。SDK 会检查三个标准请求头、签名及时间窗口。

## 3. 将事件交给你的业务系统

验签成功后，`event` 是解析后的 Python 字典。例如：

```json
{
  "type": "message.created",
  "timestamp": "2026-09-08T00:00:00Z",
  "data": {
    "id": 123,
    "conversation": "00000000-0000-4000-8000-000000000001",
    "sender": {"type": "entity", "slug": "alice", "name": "Alice", "avatar": null},
    "content": "你好，请帮我查询进度",
    "reply_id": null,
    "edited_at": null,
    "revoked_at": null,
    "create_time": 1788825600
  }
}
```

首次接入只需使用四个值：

| 字段 | 如何使用 |
| --- | --- |
| `type` | 只处理 `message.created`，其他事件可确认后忽略 |
| `data.content` | 交给你的客服、自动化或 AI 系统处理 |
| `data.conversation` | 回复时原样传回，决定回复到哪个会话 |
| `data.id` | 作为回复请求的 `reply_id`，引用这条消息 |

`timestamp` 是事件发生时间；请求头 `webhook-timestamp` 是本次发送时间。请求头 `webhook-id` 是投递去重键，重试时不变，请按字符串保存。

## 4. 把处理结果发回会话

使用管理员提供的 `CHAT_API_BASE` 和 `INTEGRATION_TOKEN`，在异步处理器中发送以下请求；用收到的事件字段替换示例值：

```python
import os

import requests


def reply_to_message(event, content):
    data = event["data"]
    response = requests.post(
        os.environ["CHAT_API_BASE"].rstrip("/") + "/integration/message",
        headers={"Authorization": f"Bearer {os.environ['INTEGRATION_TOKEN']}"},
        json={
            "conversation": data["conversation"],
            "content": content,
            "reply_id": data["id"],
        },
        timeout=10,
    )
    response.raise_for_status()
    result = response.json()
    if result["code"] != 0:
        raise RuntimeError(result.get("message", "发送失败"))
    return result["data"]


# 在异步 worker 中，对已验签、去重并出队的 event 调用：
# if event["type"] == "message.created":
#     reply_to_message(event, "收到消息")
```

| 请求字段 | 必填 | 内容 |
| --- | --- | --- |
| `conversation` | 是 | 收到的 `data.conversation` |
| `content` | 是 | 你的系统生成的回复文本 |
| `reply_id` | 否 | 收到的 `data.id`；不引用原消息时省略 |

请求路径固定为 `POST /integration/message`。成功响应使用以下结构，`data` 是发送成功的消息摘要：

```json
{"code": 0, "message": "ok", "data": {}}
```

上例省略了 `data` 的具体内容。只有 HTTP 成功且 `code` 为 `0` 才视为成功；失败时读取 `message`。机器人只能向其已加入且允许发送的会话发消息。它通过本接入发出的消息不会再次推送给同一个接入，避免直接自循环。

## 5. 联调与上线

1. 在联调会话中人工发送一条消息，确认你的接口收到 `message.created` 并验签成功。
2. 用该事件的会话 ID 和消息 ID 调用回复接口，确认会话中出现机器人回复。
3. 重复处理同一 `webhook-id`，确认业务系统不会重复执行或回复。

接收端应在**可靠保存或入队后**返回 `204`，再异步执行耗时业务；保存失败返回 `5xx`。上面的 Python 示例只确认接收，生产接入需由你的系统补上持久化、队列及原子去重。

LostSky 总请求超时为 10 秒。任意 `2xx` 都表示接收成功；其他状态或网络失败会重试，最多尝试 6 次，五次重试间隔为 15、45、135、405、1215 秒，实际时间受调度影响。事件可能重复或乱序。验签 SDK 的时间窗口检查不能替代业务去重；去重记录建议至少保留 24 小时，长时间故障时覆盖实际恢复周期。

| 遇到的问题 | 检查方式 |
| --- | --- |
| 收不到事件 | 请管理员检查订阅是否启用、机器人是否已加入会话；确认公网 HTTPS 地址可访问 |
| 验签失败 | 检查完整 `whsec_` 密钥、三个标准请求头、原始请求体及服务器时钟 |
| 回复返回 401 | 检查 API Token，不要误用签名密钥；确认凭据没有轮换 |
| 回复被拒绝 | 阅读响应 `message`；确认机器人仍在会话中、会话允许发消息 |
| 重复回复 | 按本接入与 `webhook-id` 原子去重，避免收到重试就再次处理 |

以上足以完成新消息接入与回复。需要其他事件或更完整的字段定义时，再查看 [事件协议说明](webhooks.md)和 [HTTP API 定义](../openapi/chat.openapi.json)。
