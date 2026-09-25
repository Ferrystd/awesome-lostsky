---
title: 系统运行日志
description: 配置、读取和排查 LostSky 的应用运行日志，并区分业务审计记录。
---

# 系统运行日志

LostSky 使用 ThinkPHP 日志基础设施记录应用运行状态。日志覆盖 HTTP 请求、未处理异常和主动记录的外部服务故障；它用于排查程序与部署问题，不替代数据库中的团队或平台操作审计。控制台命令的标准输出和退出码不自动写入 `console.command` 事件，若需要持久化命令结果，应由进程管理器或调度器单独收集。

## 日志边界

| 日志 | 保存位置 | 用途 |
| --- | --- | --- |
| 系统运行日志 | `LOG_PATH`，默认 `runtime/log/` | 请求状态、耗时、异常和主动记录的外部服务故障 |
| PHP 引擎日志 | PHP `error_log` | 启动、扩展、FPM 和无法进入 ThinkPHP 的错误 |
| 业务审计 | `business_audit_event` 表 | 谁在何时对团队或平台资源执行了什么操作 |

系统运行日志采用 JSON Lines：每一行都是独立 JSON 对象，至少包含 `time`、`level` 和 `event`。HTTP 请求使用 `http.request`，未处理异常使用 `exception.unhandled`；主动记录的事件使用各自的事件名。HTTP 业务写操作的审计记录与运行日志共用 `request_id`，可跨两套记录关联排查；CLI 审计没有 HTTP 请求 ID。

Team 管理者只在具备 `team.audit.read` 时通过“审计日志”读取当前 Team 的成功业务事件。失败请求、授权失败、通知已读、普通聊天消息、预检和实时连接只保留在系统运行日志；平台审计与其他 Team 的事件不会进入 Team 查询结果。业务审计按 `config/cleanup.php` 的 `business_audit_retention_days=730` 清理，不用于保存请求正文或凭据，也不承担密码学防篡改、SIEM 推送或失败授权告警。

请求日志只记录方法、Host、不含查询串的路径、HTTP 状态、耗时、应用，以及已经解析出的 `team_id`、`authenticated_user_id`、`entity_id`。系统不记录请求体、查询参数、Authorization、Cookie、密码、验证码或令牌；主动日志中的敏感键、Bearer Token 和敏感 URL 参数也会脱敏。

## 配置

`.env` 支持以下配置：

```ini
LOG_LEVEL=info,notice,warning,error,critical,alert,emergency
LOG_PATH=/var/log/lostsky
LOG_MAX_FILES=30
LOG_FILE_SIZE=10485760
LOG_CLOSE=false
```

- `LOG_LEVEL`：逗号分隔的 PSR-3 级别。默认排除 `debug` 与 `sql`，避免生产日志被调试信息和 SQL 参数污染。
- `LOG_PATH`：应用日志目录；留空时使用 `runtime/log/`。PHP-FPM 运行用户必须有创建目录和写文件权限。
- `LOG_MAX_FILES`：最多保留的日志文件数，默认 30。
- `LOG_FILE_SIZE`：单文件轮转阈值，默认 10 MiB，最小 1 MiB。
- `LOG_CLOSE`：紧急情况下设为 `true` 可关闭应用日志；通常应保持 `false`。

配置变更后执行 `php think clear` 并重启 PHP-FPM。生产部署仍需保留 `deploy/php/lostsky-production.ini` 中的 PHP `error_log`，因为 PHP 启动错误和部分致命错误发生在框架日志初始化之前。

## 查询与排查

请求失败时先按 `request_id` 查询；没有请求 ID 时按时间、`application`、`method` 和 `path` 缩小范围。HTTP `4xx` 以 `warning` 记录，`5xx` 以 `error` 记录，其余请求以 `info` 记录。未处理异常会额外产生 `exception.unhandled`，开发模式包含堆栈，生产模式只保留异常类型、消息、文件和行号。

Linux 示例：

```bash
grep '"request_id":"your-request-id"' /var/log/lostsky/*.log
grep '"event":"exception.unhandled"' /var/log/lostsky/*.log
```

CLI 命令只将结果写入终端；要保留命令输出，应由 Supervisor、systemd 或调度器配置日志文件。`php think version` 只能验证命令可运行，不会产生 `console.command` 日志：

```bash
php think version
```

长期运行的 `chat:worker` 自身每轮只向标准输出写处理计数，不会自动产生 `console.command` 日志；应以进程管理器状态和标准输出判断其运行情况。不要把应用日志目录放在公开站点目录，也不要通过 API 或静态资源域名对外提供日志文件。
