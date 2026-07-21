# 控制台命令

## 发送团队通知

`notice:send` 向指定团队发送一条共享公告通知：

```bash
php think notice:send "通知标题" --team_id=123 --content="通知正文" --pinned
```

- `title`：必填，通知标题，最长 200 个字符。
- `--team_id`：必填，目标团队 ID。
- `--content`：可选，通知正文，支持 Markdown；省略或传入空白内容时不保存正文。
- `--pinned`：可选开关，传入后将通知置顶。

命令执行前会确认目标团队有效。成功后，团队成员可以通过 Team 应用的通知接口读取公告。

尚未实现的控制台设想统一放在 [`docs/plans/`](../plans/)；微博机器人计划见 [`weibo-bot.md`](../plans/weibo-bot.md)。
