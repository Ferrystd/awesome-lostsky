# Weibo 应用

Weibo 是团队上下文的微博账号、自动发帖与每日签到工作台，前端入口为 `{slug}.weibo.lostsky.work`，开发端口为 `5181`。使用方法见[微博工作台](../manual/weibo.md)，接口契约见 [`weibo.openapi.json`](../openapi/weibo.openapi.json)。

## 鉴权边界

- 应用、全部页面和访问快照不要求 Weibo Ability。
- Weibo 不设置业务 Permission；团队范围只接受当前团队上下文，个人范围由服务端强制固定为当前 Entity。
- 只有手动发帖、点赞、评论，任务开启/恢复和 Worker 实际执行要求 Weibo Ability。
- Ability 缺失不会在页面加载时常驻报错；受限业务按钮保留禁用样式，用户点击后才说明原因。
- 团队可管理既有个人任务，但团队创建接口只能创建 `owner_entity_id = NULL` 的团队任务。

## 协议与运行边界

协议服务移植 Weico 6.4.7 的动态 `from`、本地 `s`、超话、图片上传、登录检查、写接口和 `/page/button` 超话签到。首版不提供从已有微博帖子读取或导入图片；点赞和评论的公开请求只接收微博正文页链接，由服务端在远端写入前解析目标 ID。账号凭据开发阶段在数据库明文保存，但模型序列化、响应和日志都排除凭据。真实写操作一次最多调用一个远端写接口且不自动重试。自动发帖和每日签到共用 `weibo-schedule` 队列、Ability/登录阻塞、dispatch 防重与结果日志；签到额外按服务端自然日防止重复尝试。
