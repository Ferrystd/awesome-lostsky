# 控制台命令

## 生成 Service 字典

`docs:services` 扫描 `app/service` 中各类直接声明的 public 方法，并更新公开的 [Service 字典](../glossary/service.md)：

```bash
php think docs:services
php think docs:services --check
```

默认命令生成文档；`--check` 只比较当前代码与文档，内容过期时返回非零退出码。

## 平台管理员自举

Admin 前端不能创建首位超级管理员。数据库补丁和后端发布完成后，在服务器终端使用非交互式命令授予或撤销平台角色：

```bash
php think admin:grant --user=123 --role=super_admin
php think admin:revoke --user=123 --role=super_admin
```

`--user` 是现有用户 ID，`--role` 是现有平台角色标识。授予已存在的绑定或撤销不存在的绑定都是幂等操作；撤销最后一位可用超级管理员会返回失败。命令变更写入 `business_audit_event`，来源为 `cli`，认证用户与实体为空。

## 授予团队能力

通过服务器终端为现有团队开通或更新一项 Ability：

```bash
php think team:grant-ability --team=example-team --ability=doc
php think team:grant-ability --team=example-team --ability=transaction --level=2 --expire-time=1798761599
```

- `--team`：必填，现有团队 slug。
- `--ability`：必填，已有能力标识：`doc`（文档）、`file`（文件上传）或 `transaction`（交易）。
- `--level`：可选，正整数能力等级，默认 `1`。
- `--expire-time`：可选，Unix 时间戳；默认 `0`，表示永久有效。

同一团队与能力重复授予时会更新等级和有效期；已软删除的记录会恢复。命令变更写入 `business_audit_event`，来源为 `cli`，认证用户与实体为空。

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

## 统一部署所有域名证书

`certificate:update` 将同一张 Let’s Encrypt PEM 证书部署到全部 LostSky 域名：Nginx 承载前端和 API，OSS SDK 更新 `oss.lostsky.work` 的证书托管。

```bash
php think certificate:update
```

证书文件默认取自 `/etc/letsencrypt/live/lostsky.work/fullchain.pem` 和 `privkey.pem`，可通过 `TLS_CERTIFICATE_PATH`、`TLS_PRIVATE_KEY_PATH` 或单次选项覆盖。宝塔 Nginx 不在 `PATH` 时配置实际二进制路径：

```ini
TLS_CERTIFICATE_PATH=/etc/letsencrypt/live/lostsky.work/fullchain.pem
TLS_PRIVATE_KEY_PATH=/etc/letsencrypt/live/lostsky.work/privkey.pem
TLS_NGINX_BINARY=/www/server/nginx/sbin/nginx
```

默认共享证书必须包含以下 SAN：

```text
lostsky.work
*.lostsky.work
*.api.lostsky.work
*.team.lostsky.work
*.chat.lostsky.work
*.transaction.lostsky.work
*.display.lostsky.work
*.shop.lostsky.work
*.account.api.lostsky.work
*.admin.api.lostsky.work
*.common.api.lostsky.work
*.team.api.lostsky.work
*.chat.api.lostsky.work
*.transaction.api.lostsky.work
*.display.api.lostsky.work
*.shop.api.lostsky.work
```

`*.lostsky.work` 只覆盖 `api.lostsky.work` 这类单层域名，不覆盖 `demo.display.lostsky.work`，所以动态前端和 API 域名需要各自的嵌套通配符。非默认部署可用逗号分隔的 `TLS_REQUIRED_NAMES` 覆盖清单。

执行顺序固定为：

1. 检查证书有效期、全部 SAN 和私钥匹配关系。
2. 执行 `nginx -t`；配置无效时不重载 Nginx，但仍继续尝试 OSS 更新。
3. 通过官方 OSS PHP SDK V2 强制更新 OSS 自定义域名证书。
4. 独立执行 `nginx -s reload`，让全部前端和后端站点加载新证书；即使 OSS 更新失败，也不阻塞 Nginx 加载已续期证书。

成功输出 Nginx 状态和 OSS 请求 ID；任一目标失败时输出各目标状态和错误摘要并以 `1` 退出，且不会输出 AccessSecret 或私钥内容。仅在恢复场景跳过 Nginx：

```bash
php think certificate:update --no-nginx
```

通配符证书必须通过 DNS-01 签发。完成 Certbot 的 DNS 自动验证和续期配置后，将统一命令作为 deploy hook：

```bash
certbot renew --deploy-hook 'cd /www/deploy/lostsky && php think certificate:update'
```
