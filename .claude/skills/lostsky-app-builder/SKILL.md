---
name: lostsky-app-builder
description: >
  在 LostSky ThinkPHP 8 项目中搭建一个完整的新应用（模块）。编排「需求了解 → 模型 → 服务 → 控制器」
  四个阶段，每个阶段都有计划→审批→执行→审查的循环。适用于任何新应用的搭建，如记账、通知、
  文件管理、消息等。当用户要新建一个应用、添加一个模块、搭建某个功能模块时使用。
  Ordinarily, speak in Chinese.
---

# LostSky App Builder

搭建 LostSky 新应用的完整工作流。每一步完成后等待用户确认再继续。

## 核心约束

- 参考 [app/transaction/](app/transaction/) 作为架构范本
- 遵循 [CLAUDE.md](CLAUDE.md) 中的全部约定
- 模型创建委托给 `/lostsky-model` skill
- 代码审查委托给 `/code-review` skill
- 所有文件生成后运行 `php think` 确认无语法错误

---

## 阶段一：需求了解

向用户了解要搭建的应用，弄清楚：

1. **应用名**：对应 ThinkPHP 多应用的目录名（如 `transaction`）
2. **核心业务**：这个应用要解决什么问题
3. **数据实体**：需要哪些模型/表，它们之间的关系
4. **角色与权限**：是否需要新的中间件来鉴权
5. **外部依赖**：依赖哪些已有的模型和服务

### 产出：实施计划

将以上信息整理为结构化计划，包含：

- **模型清单**：每张表的字段和关联
- **枚举清单**：需要的 enum 类
- **服务清单**：每个服务的职责和方法签名（含验证器、中间件需求）
- **控制器清单**：每个控制器的路由和中间件配置
- **依赖关系**：模型 → 服务 → 控制器的先后顺序

**等待用户审阅计划、调整后确认，再进入下一阶段。**

---

## 阶段二：制作模型

### 2a. 枚举 (Enum)

如果计划中包含枚举，先完成枚举。参考 [app/enum/TransactionType.php](app/enum/TransactionType.php) 的风格：

```php
namespace app\enum;
use think\model\contract\EnumTransform;

enum XxxType: int implements EnumTransform
{
    case A = 1;
    case B = 2;

    public function value(): string
    {
        return match ($this) {
            self::A => '中文描述',
            self::B => '中文描述',
        };
    }
}
```

### 2b. 模型

按计划中的顺序，**每张表调用一次 `/lostsky-model`**，该 skill 会引导完成：

- `php think make:model ModelName` 生成骨架
- 设计字段、编写 CREATE TABLE 语句
- 填充 `$type` `$json` `$hidden` `$append` `$readonly`
- 添加获取器/修改器/搜索器
- 设计并写入关联
- 追加 SQL 到 `sql/schema.sql`

### 2c. 模型审查

所有模型完成后，调用 `/code-review` 审查全部新增模型代码。

**等待用户确认模型阶段完成，再进入下一阶段。**

---

## 阶段三：制作服务

### 3a. 服务计划确认

重新列出服务清单，逐服务说明：

- 类名和文件路径
- 每个方法的签名、参数、返回值
- 需要的验证规则
- 需要的中间件（如果需要新建）

**等待用户审阅、调整后确认。**

### 3b. 编写服务

按计划逐个编写。每个服务遵循：

```php
namespace app\service;

use app\model\...;
use think\exception\HttpException;
use think\facade\Db;

class ServiceName
{
    public function list(int $teamId, array $filters, int $page, int $limit): array
    {
        // 查询 → 关联加载 → 分页 → 返回
    }

    public function create(int $teamId, array $data): int
    {
        // 验证 → 事务 → 新建 → 返回 id
    }

    public function edit(int $teamId, int $id, array $data): void
    {
        // 查找 → 验证 → 更新
    }

    public function delete(int $teamId, int $id): void
    {
        // 查找 → 软删除
    }
}
```

**关键规范**：
- 多模型操作必须用 `Db::transaction()` 包裹
- 验证失败抛出 `throw new HttpException(422, '错误描述')`
- 资源不存在抛出 `throw new HttpException(404, '资源不存在')`
- 所有参数显式声明类型 `int $teamId`
- 服务类不加任何后缀

### 3c. 验证器（按需）

在 `app/validate/` 下创建验证器，参考现有风格。服务方法中调用验证器。

### 3d. 中间件（按需）

如果计划中包含新中间件，在 `app/middleware/` 下创建，遵循现有模式：
- 从 Request 读取 `team_id`、`member_id` 等
- 不符合条件时 `throw new HttpException(403, '无权操作')`

### 3e. 服务审查

全部服务编写完毕后，调用 `/code-review` 审查。

**等待用户确认服务阶段完成，再进入下一阶段。**

---

## 阶段四：制作控制器

### 4a. 控制器计划确认

列出控制器清单，逐控制器说明：

- 类名、文件路径、命名空间
- 每个方法 → HTTP 方法 + URI → 中间件保护
- 请求参数和响应格式

**等待用户审阅、调整后确认。**

### 4b. 编写控制器

参考 [app/transaction/controller/](app/transaction/controller/) 的风格：

```php
namespace app\{app_name}\controller;

use think\Request;

class ControllerName
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'MemberAccess' => ['except' => []],
        // 应用专属中间件
    ];

    public function index(Request $request)
    {
        $service = app(\app\service\Xxx::class);
        $result  = $service->list($request->team_id, [...], ...);
        return success($result);
    }
}
```

**关键规范**：
- 使用 `app()` 容器获取服务，禁止 `new`
- 统一用 `success($data, $msg)` / `message($msg)` / `error($msg, $code, $http)` 返回
- `$middleware` 数组用字符串别名，中间件只声明 `except` 或 `only`
- 控制器不加后缀，允许多级目录
- 从 `$request` 提取参数时做显式类型转换

### 4c. 注册路由

在 `app/{app_name}/route.php` 注册所有路由：

```php
use think\facade\Route;

// 资源名
Route::get('{resource}', '{Controller}/index');
Route::get('{resource}/<id>', '{Controller}/get');
Route::post('{resource}', '{Controller}/create');
Route::post('{resource}/<id>', '{Controller}/edit');
Route::post('{resource}/<id>/delete', '{Controller}/delete');
```

### 4d. 注册中间件别名（按需）

如果新建了中间件，在 `config/middleware.php` 的 `alias` 数组中追加条目。

### 4e. 控制器审查

全部完成后调用 `/code-review` 审查。最后运行：

```bash
php think
```

确认无语法错误。

**等待用户最终确认，应用搭建完成。**
