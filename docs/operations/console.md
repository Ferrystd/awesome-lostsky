# 控制台命令

## 生成 Service 字典

`docs:services` 扫描 `app/service` 中各类直接声明的 public 方法，并更新公开的 [Service 字典](../glossary/service.md)：

```bash
php think docs:services
php think docs:services --check
```

默认命令生成文档；`--check` 只比较当前代码与文档，内容过期时返回非零退出码。

## 发送团队通知

`notice:send` 由 LostSky 向指定 Team 发送一条公告通知：

```bash
php think notice:send "通知标题" --team_id=123 --content="通知正文" --pinned
```

- `title`：必填，通知标题，最长 200 个字符。
- `--team_id`：必填，收件 Team ID。
- `--content`：可选，通知正文，支持 Markdown；省略或传入空白内容时不保存正文。
- `--pinned`：可选开关，传入后将通知置顶。

命令执行前会确认目标 Team 有效。成功后，Team 身份可以通过原有通知接口读取并确认公告。

## 通用 Service 调用

`service:call` 通过短类名和 public 方法名直接调用 `app\service` 中的服务。参数使用 JSON 对象，键名必须与 PHP 方法参数名完全一致：

```bash
# Bash
php think service:call Notice send --params='{"teamId":123,"title":"测试通知"}'
php think service:call Pagination normalize --params='{"page":0,"limit":200}'
```

Windows PowerShell 需要为传给原生程序的 JSON 双引号增加反斜杠：

```powershell
php think service:call Pagination normalize '--params={\"page\":0,\"limit\":200}'
```

未传 `--params` 时等价于 `{}`。命令支持 JSON 可表达的 `int`、`float`、`string`、`bool`、`array`、`mixed`、可空类型、可明确匹配的联合类型和 backed enum；不隐式转换标量类型。需要 Request、Model、上传文件等对象参数或可变参数的方法不能通过此命令调用。

成功和失败都向标准输出写入单行 JSON。成功退出码为 `0`：

```json
{"code":0,"message":"ok","data":[1,100]}
```

失败退出码为 `1`，`data.http_code` 表示参数错误、目标不存在或服务异常对应的状态：

```json
{"code":1,"message":"Missing required parameter: limit","data":{"http_code":422}}
```

该命令信任服务器终端权限，不执行 HTTP 路由、中间件、身份鉴权、请求去重或控制器业务审计。调用写方法可能直接修改数据库、删除数据、发起网络请求或签发令牌，使用前应确认目标 Service 的实际行为。

尚未实现的控制台设想统一放在 [`docs/plans/`](../plans/)；微博机器人计划见 [`weibo-bot.md`](../plans/weibo-bot.md)。
