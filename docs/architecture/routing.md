# 请求路由与应用解析

LostSky 使用 ThinkPHP 8 多应用模式。API 请求先确定应用，再按域名解析可选的团队上下文，最后进入对应应用的路由和控制器。

## 请求入口

团队应用支持三种入口：

| 方式 | 示例 | 应用来源 | 团队来源 |
|---|---|---|---|
| 前端 Origin | `Host: api.lostsky.work`，`Origin: https://demo.team.lostsky.work` | Origin 第二段 `team` | Origin 第一段 `demo` |
| API 子域名 | `demo.team.api.lostsky.work` | Host 第二段 `team` | Host 第一段 `demo` |
| 自定义域名 | `workspace.example.com` | `team_domain.app` | `team_domain.team_id` |

不依赖团队上下文的应用也可以使用单段前端域名。例如 `Origin: https://account.lostsky.work` 会选择 Account 应用，但不会绑定团队。

域名根和 API 域名由 `config/app.php` 的 `domain.root`、`domain.api` 配置。生产默认值为 `lostsky.work` 和 `api.lostsky.work`。

## 解析流程

全局中间件优先级为：

1. `Cors`：处理预检和 API 跨域响应头。
2. `AppResolver`：从 Host 或 Origin 选择应用，并绑定可用的团队上下文。
3. `MultiApp`：由 ThinkPHP 完成多应用分发。
4. `Dedup`：根据可选的 `X-Page-Id` 过滤短时间内的重复请求。

`AppResolver` 通过 `Team::active()` 查询团队，并将 `team`、`team_id` 和 `slug` 写入请求。团队查询按 slug 或 ID 缓存 3600 秒。

应用控制器随后按需要组合 `JwtAuth`、`Context`、成员身份、团队管理、能力和普通权限中间件。`Context` 依赖 JWT 与团队解析结果，只负责补充用户、成员和顾客上下文，不负责授权。

## 无团队应用

`config/app.php` 的 `teamless_apps` 保存无需团队上下文即可运行的应用。当前配置为：

```php
'teamless_apps' => ['account'],
```

Account 负责登录、注册、设备和用户团队入口；选定团队后，团队业务应用再使用包含 slug 的域名。

## 自定义域名

标准 LostSky 域名由 `AppResolver` 动态解析，不依赖静态 `domain_bind`。

自定义域名保存在 `team_domain` 表。运行期的 `HttpRun` 监听器读取有效绑定，将 `domain => app` 映射注入 ThinkPHP 的 `domain_bind`；`AppResolver` 同时根据自定义 Host 查询团队并写入请求上下文。绑定缓存时间为 3600 秒。

## 路由组织

全局团队解析位于 `route/app.php`，每个应用在自己的目录维护路由：

```text
route/app.php
app/{app}/route.php
app/{app}/controller/
```

`config/route.php` 当前允许在没有显式路由时回退到控制器与动作解析，但对外接口仍应声明在应用的 `route.php` 中，并同步维护 OpenAPI。

## 新增应用

新增应用时按以下顺序接入：

1. 使用 ThinkPHP 控制台生成所需控制器等骨架，并在 `app/{app}/route.php` 声明对外路由。
2. 为控制器配置所需的中间件别名；团队应用应复用全局解析出的团队上下文。
3. 仅当应用确实不依赖团队时，才把应用名加入 `teamless_apps`。
4. 标准 LostSky 域名无需增加静态 `domain_bind`；自定义域名通过 `team_domain` 数据管理。
5. 在 `docs/openapi/` 增加或更新对应 OpenAPI 文件，并同步生成前端 API 类型。
6. 在 [`docs/apps/`](../apps/) 增加应用职责和鉴权边界概览。

## 请求示例

通过 Origin 选择团队应用：

```bash
curl https://api.lostsky.work/member/index \
  -H "Origin: https://demo.team.lostsky.work" \
  -H "Authorization: Bearer {token}"
```

通过 API 子域名选择团队应用：

```bash
curl https://demo.team.api.lostsky.work/member/index \
  -H "Authorization: Bearer {token}"
```

通过单段 Origin 选择无团队应用：

```bash
curl -X POST https://api.lostsky.work/login/password \
  -H "Origin: https://account.lostsky.work" \
  -H "Content-Type: application/json" \
  -d '{"account":"example","password":"example"}'
```
