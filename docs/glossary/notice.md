# 通知

LostSky 的团队工作台使用以下通知术语：

- **通知**：当前实体收到的单向通知，由具备 `team.notice.send` 权限的实体代表 Team 发送。
- **发送通知**：代表当前 Team 向同 Team 的 Team、成员、客户或虚拟实体发送通知。
- **站内通知**：LostSky 发给 Team 的共享通知，需要 `team.notice.read` 权限查看。

接口继续使用 `scope=entity` 表示当前实体收件箱，使用 `scope=team` 表示 Team 共享收件箱。
