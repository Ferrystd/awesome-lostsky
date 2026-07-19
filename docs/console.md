# console

## 团队通知

向指定团队发送一条共享公告通知：

```bash
php think notice:send "通知标题" --team_id=123 --content="通知正文" --pinned
```

- `title`：必填，通知标题，最长 200 个字符。
- `--team_id`：必填，目标团队 ID。
- `--content`：可选，通知正文，支持 Markdown；省略或传入空白内容时不保存正文。
- `--pinned`：可选开关，传入后将通知置顶。

## /bot 微博
### [controller] content-内容
### [controller] login-微博登录
