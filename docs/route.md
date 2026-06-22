# 路由文档

## 请求入口架构

API 请求统一发往 `api.lostsky.work` 或其子域名。共有三种方式确定当前请求的 **Team（slug）** 和应用模块（**app**）：

| 方式 | 入口域名 | slug 来源 | app 来源 | 状态 |
|------|----------|-----------|----------|------|
| **方式 1** Origin | `api.lostsky.work` | Origin 头域名第一段 | Origin 头域名第二段 | 已实现 |
| **方式 2** API 子域名 | `{slug}.{app}.api.lostsky.work` | 请求头 Host 第一段 | 请求头 Host 第二段 | 已实现 |
| **方式 3** 自定义域 | `custom-domain.com` | `team_domain` 表查询 | `team_domain` 表查询 | 已实现 |


方式 1: 用户浏览器访问 team-a.account.lostsky.work
       → 前端 JS 向 api.lostsky.work/login/phone 发起请求
       → 请求头 Host = api.lostsky.work，Origin = https://team-a.account.lostsky.work
       → slug 和 app 取自 Origin 头域名

方式 2: 前端直接向 team-a.account.api.lostsky.work/login/phone 发起请求
       → 请求头 Host = team-a.account.api.lostsky.work
       → slug 和 app 取自请求头 Host 域名

方式 3: my-studio.com/login/phone
       自定义域名 CNAME 到服务器，通过 team_domain 表查得 slug/app


---

## Team 解析

`route/app.php` 在路由加载时解析 team，绑定到 `$request->team` 和 `$request->slug`（通过 `team()` 辅助函数获取）。

| 方式 | 解析来源 | 逻辑 |
|------|----------|------|
| 方式 1 | `Origin` 头 | `api.lostsky.work` 的请求，从 Origin 提取用户域名 `{slug}.{app}.lostsky.work` 的首段 |
| 方式 2 | `Host` 头 | `{slug}.{app}.api.lostsky.work` 的请求，从 Host 提取首段 |
| 方式 3 | `Host` 头 | 自定义域名，从 `team_domain` 表反查 |

域名通过配置集中管理（`config/app.php`）：

```php
'domain' => [
    'root' => 'lostsky.work',
    'api'  => 'api.lostsky.work',
],
```

Team 查询使用模型 scope `Team::active()` 过滤封禁/注销状态，缓存 TTL 统一为 3600 秒。

### 无 Team 状态的应用

`config/app.php` 的 `teamless_apps` 定义了不需要 team 上下文的应用列表：

```php
'teamless_apps' => ['admin'],
```

---

## 域名绑定 (domain_bind)

`config/app.php` 中的 `domain_bind` 仅用于方式 3（自定义域名精确匹配）。方式 1 和方式 2 的 app 由 `AppResolver` 中间件动态解析。

```php
'domain_bind' => array_merge(
    [],
    // 自定义域名（从 team_domain 表加载，缓存 1 小时）
    TeamDomain::cache('team_domain_bind', 3600)->column('app', 'domain'),
),
```

> **注意**：方式 1（`api.lostsky.work`）和方式 2（`{slug}.{app}.api.lostsky.work`）的 app 均由 `AppResolver` 中间件动态解析，不依赖 `domain_bind` 静态映射。未匹配到的域名框架将报错，不设兜底。

---

## 路由文件组织

```
route/app.php              ← 全局路由（所有应用共享）
app/account/route.php      ← account 应用路由
```

配置要点（`config/route.php`）：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `url_route_must` | `false` | 非强制路由，无路由匹配时回退到控制器/方法解析 |
| `controller_layer` | `controller` | 控制器目录名 |
| `default_controller` | `Index` | 默认控制器 |
| `default_action` | `index` | 默认方法 |

---

## account 应用路由

定义在 `app/account/route.php`：

| 方法 | URL | 控制器 | 中间件 |
|------|-----|--------|--------|
| POST | `login/phone` | `Login::phone` | — |
| POST | `login/password` | `Login::password` | — |
| POST | `register/phone` | `Register::phone` | — |
| POST | `devices/quit` | `Devices::quit` | JwtAuth（控制器内声明） |
| POST | `devices/quitAll` | `Devices::quitAll` | JwtAuth（控制器内声明） |

---

## 中间件体系

### 全局中间件 (`app/middleware.php`)

所有请求自动经过：

| 顺序 | 中间件 | 文件 | 作用 |
|------|--------|------|------|
| 1 | AppResolver | `app\middleware\AppResolver` | 方式 1：从 Origin 头动态解析 app，在 MultiApp 之前执行 |
| 2 | Dedup | `app\middleware\Dedup` | 防重复提交（依赖 `X-Page-Id` 请求头） |

### 中间件别名 (`config/middleware.php`)

```php
'Dedup'   => app\middleware\Dedup::class,
'JwtAuth' => app\middleware\JwtAuth::class,
```

控制器中使用别名声明：

```php
class Devices
{
    protected $middleware = ['JwtAuth'];
}
```

---

## 添加新应用

1. 创建应用目录和路由文件：
   ```
   app/console/route.php
   app/console/controller/...
   ```

2. 在 `config/app.php` 注册域名绑定并更新兜底：
   ```php
   'domain_bind' => [
       'console.api.lostsky.work' => 'console',
       '*'                        => 'console',
   ],
   ```

3. 若该应用不需要 team 上下文，添加到 `teamless_apps`：
   ```php
   'teamless_apps' => ['admin', 'console'],
   ```

4. `route/app.php` 自动从 Host 解析 team，无需额外配置。

---

## 公共辅助函数

`app/common.php` 中定义了以下辅助函数，在控制器和服务中可直接调用：

| 函数 | 说明 |
|------|------|
| `team()` | 返回当前 `Team` 实例，无 team 时返回 `null` |
| `team('display_name')` | 返回 Team 实例的指定属性 |
| `jwt()` | 返回 JWT payload 对象（需经过 JwtAuth 中间件） |
| `jwt('uid')` | 返回 JWT payload 的指定属性 |
| `app_name()` | 返回当前应用模块名（如 `account`、`admin`） |

---

## 请求示例

### 方式 1（Origin 头）

```bash
curl -X POST https://api.lostsky.work/login/phone \
  -H "Origin: https://team-a.account.lostsky.work" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

### 方式 2（API 子域名）

```bash
curl -X POST https://team-a.account.api.lostsky.work/login/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

### 方式 3（自定义域名）

```bash
curl -X POST https://my-studio.com/login/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```
