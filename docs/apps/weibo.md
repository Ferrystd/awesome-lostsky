# Weibo 应用

Weibo 是团队上下文的微博账号、自动发帖与每日签到工作台，前端入口为 `{slug}.weibo.lostsky.work`，开发端口为 `5181`。使用方法见[微博工作台](../manual/weibo.md)，接口契约见 [`weibo.openapi.json`](../openapi/weibo.openapi.json)。

## 鉴权边界

- 基础概览和访问快照不要求 Weibo Permission 或 Ability。
- 团队业务导航、数据读取与本地管理要求 `weibo.team.manage`；个人对应操作要求内部 Entity 与 `weibo.personal.use`。
- 团队范围接受本团队 Entity，或获得目标团队角色的外部有效 Entity；个人范围仍由服务端固定为当前团队内的 Entity。
- 只有手动发帖、点赞、评论，任务开启/恢复和 Worker 实际执行要求 Weibo Ability。
- Permission 或 Ability 缺失不会在页面加载时主动报错，也不会显示常驻原因或悬停提示；受限入口和业务按钮仅做灰度降权，保持可聚焦、可点击，用户点击后才短时说明原因且不发受保护请求。
- 团队可管理既有个人任务，但团队创建接口只能创建 `owner_entity_id = NULL` 的团队任务。
- Worker 执行已经运行的任务不回查创建者当前 Permission，只按团队 Weibo Ability 与账号、任务状态执行。

## 协议与运行边界

协议服务移植 Weico 6.4.7 的动态 `from`、本地 `s`、超话、图片上传、登录检查、写接口和 `/page/button` 超话签到。首版不提供从已有微博帖子读取或导入图片；点赞和评论的公开请求只接收微博正文页链接，由服务端在远端写入前解析目标 ID。账号凭据开发阶段在数据库明文保存，但模型序列化、响应和日志都排除凭据。真实写操作一次最多调用一个远端写接口且不自动重试。自动发帖和每日签到共用 `weibo-schedule` 队列、Ability/登录阻塞、dispatch 防重与结果日志；签到额外按服务端自然日防止重复尝试。
