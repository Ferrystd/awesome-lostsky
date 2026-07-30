# 请求路由与应用解析

LostSky 使用 ThinkPHP 8 多应用模式。API 请求先确定应用，再按域名解析可选的团队上下文，最后进入对应应用的路由和控制器。

## 请求入口

团队应用支持三种入口：

| 方式 | 示例 | 应用来源 | 团队来源 |
|---|---|---|---|
| 前端 Origin | `Host: api.lostsky.work`，`Origin: https://demo.team.lostsky.work` | Origin 第二段 `team` | Origin 第一段 `demo` |
| API 子域名 | `demo.team.api.lostsky.work` | Host 第二段 `team` | Host 第一段 `demo` |
| 自定义域名 | `workspace.example.com` | `team_domain.app` | `team_domain.team_id` |
| 公共上传 | `Host: api.lostsky.work`，`X-LostSky-App: common` | 显式请求头，仅允许 `common` | Host、Origin 或 `team_domain` |

不依赖团队上下文的应用也可以使用单段前端域名。例如 `Origin: https://account.lostsky.work` 会选择 Account 应用但不会绑定团队；`Origin: https://admin.lostsky.work` 同理选择平台 Admin 应用。

Display 与 Shop 使用标准团队前端 Origin
`https://{slug}.display.lostsky.work`、`https://{slug}.shop.lostsky.work`。两者都需要有效团队上下文，
但公开展示控制器不组合登录或实体身份中间件；Shop 的客户写接口仍按各自路由要求认证。

域名根和 API 域名由 `config/app.php` 的 `domain.root`、`domain.api` 配置。生产默认值为 `lostsky.work` 和 `api.lostsky.work`。

## 解析流程

全局中间件优先级为：

1. `Cors`：处理预检和 API 跨域响应头。
2. `AppResolver`：从 Host 或 Origin 选择应用，并绑定可用的团队上下文。
3. `MultiApp`：由 ThinkPHP 完成多应用分发。
4. `Dedup`：优先按 `X-Request-Id`，兼容按 `X-Page-Id + 内容`，请求头缺省时按登录主体、路径和内容过滤短时间内的重复写请求。

`AppResolver` 通过 `Team::active()` 查询团队，并将 `team`、`team_id` 和 `slug` 写入请求。团队查询按 slug 或 ID 缓存 3600 秒。

应用控制器随后按需要组合 `JwtAuth`、`Context`、`EntityRequired`、`TeamAuth`、实体类型、能力和普通权限中间件。`TeamAuth` 组合 `EntityRequired → TeamBelongs`：缺少实体返回 HTTP 428 / `42801`，团队不匹配返回 HTTP 403 / `40301`，两者都携带当前 `team_slug`。允许跨团队实体的接口只使用 `EntityRequired`，要求当前团队归属的接口使用 `TeamAuth`。`Context` 依赖 JWT 与团队解析结果，只负责补充真实用户、实体、成员和顾客上下文，不负责授权。

## 无团队应用

`config/app.php` 的 `teamless_apps` 保存无需团队上下文即可运行的应用。当前配置为：

```php
'teamless_apps' => ['account', 'admin'],
```

Account 负责登录、注册、设备、用户团队入口和所有实体会话签发/撤销；Admin 负责平台级 RBAC、用户与团队治理、审计和系统状态。两者均不接收团队上下文。选定团队后，团队业务应用再使用包含 slug 的域名。业务应用的共享客户端收到 `42801` 或 `40301` 时进入 Account 成员回调，显式按 `team_slug` 领取身份后返回原深链接。`X-LostSky-App` 的显式白名单仍只包含 `common`。

## 自定义域名

标准 LostSky 域名由 `AppResolver` 动态解析，不依赖静态 `domain_bind`。

自定义域名保存在 `team_domain` 表。运行期的 `HttpRun` 监听器读取有效绑定，将 `domain => app` 映射注入 ThinkPHP 的 `domain_bind`；`AppResolver` 同时根据自定义 Host 查询团队并写入请求上下文。绑定缓存时间为 3600 秒。

## 路由组织

全局团队解析位于 `route/app.php`，每个应用在自己的目录维护路由：

```text
route/app.php
app/{app}/route/app.php
app/{app}/controller/
```

`config/route.php` 使用 `url_route_must=true` 禁止控制器与动作自动回退；所有对外接口必须声明在应用的 `route/app.php` 中，并同步维护 OpenAPI。

含通用 `<id>` 路径变量的应用，在自己的路由文件顶部集中声明整数规则：

```php
use think\facade\Route;

Route::pattern(['id' => 'int']);

Route::get('product/<id>', 'Product/get');
Route::post('product/<id>', 'Product/edit');
```

全局规则必须放在 `app/{app}/route/app.php`，作用域只覆盖当前应用；不要在每条路由后重复 `->pattern(['id' => '\d+'])`。规则名称和写法参见 [ThinkPHP 全局变量规则](https://doc.thinkphp.cn/v8_0/vars_rule.html)。

当前锁定的 ThinkPHP 8.1.4 中，全局 `id => int` 负责限制路由匹配，因此非数字 ID 在路由层返回 404，但匹配后的原始路由变量仍是字符串。控制器必须使用 `$request->route('id/d')` 完成整数转换；不得改用 `param()`，否则 query 或 body 中的同名字段可能覆盖路径 ID。

控制器中间件的位置参数使用冒号，例如 `Ability:transaction:2`；只有中间件自行定义的参数列表使用逗号，例如 `EntityType:team,teamMember`。

## 新增应用

新增应用时按以下顺序接入：

1. 使用 ThinkPHP 控制台生成所需控制器等骨架，并在 `app/{app}/route/app.php` 声明对外路由。
2. 为控制器配置所需的中间件别名；团队应用应复用全局解析出的团队上下文。
3. 仅当应用确实不依赖团队时，才把应用名加入 `teamless_apps`。
4. 标准 LostSky 域名无需增加静态 `domain_bind`；自定义域名通过 `team_domain` 数据管理。
5. 在 `docs/openapi/` 增加或更新对应 OpenAPI 文件，并同步生成前端 API 类型。
6. 在 [`docs/apps/`](../apps/) 增加应用职责和鉴权边界概览。

## 前端单入口

每个前端域名只发布一个 `index.html`。Nginx/CDN 对不存在的非静态路径统一回退到该文件，由 Vue Router 完成 history 路由；共享资产域名继续对不存在的资源返回 404，不得回退 HTML。

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

通过 Origin 读取团队公开主页：

```bash
curl https://api.lostsky.work/profile/get \
  -H "Origin: https://demo.display.lostsky.work"
```
