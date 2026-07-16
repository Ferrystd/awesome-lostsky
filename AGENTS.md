# AGENTS.md

## 文本编码与中文防乱码

所有文件统一使用 **UTF-8 无 BOM** 保存，禁止使用其他编码重新保存。

尽量不使用终端，而是使用编辑器原生能力查看与编辑文件。
必须使用且 Windows/PowerShell 下查看中文时，如果终端显示乱码，不得转码；应先用 `rg` 或其他**UTF-8**编辑器和脚本读取确认。
HTML 必须保留 `<meta charset="UTF-8">`

## 项目概况

基于 **ThinkPHP 8** 框架构建的 **纯后端 API 服务**。运行环境要求 PHP 8.0+。

- **[前端](/www/)**：部署在 CDN，。后端只返回 JSON，不做 SSR 和页面渲染。

- **多应用**：使用 ThinkPHP 8 多应用模式。一个 App = 一组功能入口（如 `console` 控制台、`account` 认证）。该项目只提供API服务。一个产品一个应用

## 前端

### 约定

保持静态 HTML/CSS/JS 交付，不引入 Vite、Webpack、npm build 等需要安装依赖或打包的流程。支持和推荐使用 CDN；新增能力使用自写代码、CDN 库，复制代码进仓库并保留来源与许可证说明。（尽量不新造轮子）

### 新增
读取`docs/openapi/`中所需要的json，使用 `/ui-ux-pro-max`,`/lostsky-frontend` 构建页面

### 修改
使用`/ui-ux-pro-max`修改页面，不使用`/lostsky-frontend`

### 架构
一切多域名复用文件存储在[](/www/assets.lostsky.work/)。
单域名复用文件存储在各自`/assets/`文件夹

## 控制台命令

```bash
#读取全部命令
php think

#不允许手动新建文件 一切使用：
php think make:model #新建模型 
php think make:controller #新建控制器
#其他同理...
```
1. 尽量使用控制台命令
2. 使用控制台新增文件，可以自动完成模型骨架等

## 核心架构

### 模型层规范

统一继承 `app\model\Base`（而非 `think\Model`或`think\Db`）。
项目禁止使用 `think\facade\Db` 查询或写入业务数据；仅允许使用 `Db::transaction()` 管理跨模型事务，事务内的数据操作仍须通过模型完成。
`Base` 提供能力：

- **自动时间戳**
- **软删除**：自动处理，不需写判断`delete_time`逻辑(用`crash`而非`delete`方法)。自动充当业务删除，不额外写删除逻辑。

开发约定：

- **字段类型转换**：在 `$type` 数组中声明字段类型映射（`'id' => 'integer'` 等），可能使用`$json`
- **数据库字符集**：`utf8mb4`，排序规则 `utf8mb4_unicode_ci`，引擎 `InnoDB`
- **关联**：使用`hasOne()`,`bind()`,`belongTo`等关联，而非手动写逻辑
- **命名空间**：`app\model`。
- **跨表默认数据**：保留空数据+获取器兜底，而非频繁用复制解决字段默认值。
- **文件模板**：使用`make:model`可建构`$type`,`$hidden`等数组
- **字段命名**：最简，如`customer_id`代替`team_customer_id`
- **不随意写独立方法**：优先用获取器、修改器、搜索器，再不济也用scope语法糖等
- **能null则null**：`null`是合法的所有type。不用0,''替代null语义
- **数据计算**：交给数据库，禁止在php侧计算

### 中间件体系

- 在 `config/middleware.php` 注册别名。
- 使用别名，禁用完整类名，简化代码。
- 命名:
+ `{$app}Ability`:团队能力
+ `{$app}Access`:管理员身份确认
+ `{$app}Verify`:成员身份确认

#### 防重放攻击、多次点击：
1. **Dedup** :前端页面生成UUID，对每个页面滤除多次请求

#### 鉴权流程：
1. **Cors**
2. **JwtAuth** :JWT 认证中间件，确定用户
3. **Context** :进一步提取 user_id、team_id、member_id
4. 团队能力鉴权（例）
+ **TransactionAbility**:记账能力校验
5. 成员访问鉴权（例）
**MemberAccess**:成员自我操作权限
**TeamAccess**:team管理权限
**TransactionAccess**:记账应用team管理权限
**TransactionVerify**:记账应用成员操作权限

### 服务与控制器规范

1. 统一不加`Service`,`Controller`，`Validate`等后缀
2. 控制器一般在应用内，模型、服务、验证器一般在应用外

- **控制器**：负责提取参数、调用服务、返回响应。不写业务逻辑。允许多级控制器，模型`1对1关联`合并控制器，模型`1对多关联`拆分控制器。
- **服务**：封装业务逻辑。多模型操作必须**使用事务**，避免数据不同步。
- **服务解析**：通过 `app()` 容器获取服务实例（`app(Login::class)`），禁止 `new` 。便于 thinkphp 框架加载钩子和绑定，后续单元测试 mock。
- **命名空间冲突**：使用完整命名空间区分不同命名空间的同名类，不可使用 `as`。中间件只使用字符串别名，不考虑类名矛盾。
- **验证器**：服务层调用验证，不通过抛出 `HttpException(422, $validator->getError())`。
- **响应规范**：控制器统一用 `success($data, $msg)` / `error($msg, $code, $http)` / `message($msg)` 返回，不直接写 `json()`。信封结构 `{code:0, message:"ok", data:{}}`，code=0 成功，非 0 业务错误。服务层只抛 `HttpException`，不构造响应。

### 个人即团队（Personal as Team）

个人和团队统一在 `Team` 模型中。个人用户注册时自动创建 `type=personal` 的 Team，所有服务均基于 Team，代码不区分「个人」和「团队」分支。

- **Team.type**：`personal`（个人空间）| `team`（协作空间）
  - `personal`：注册自动创建，一个用户有且仅有一个，不可解散
  - `team`：用户主动创建，可有多成员，可解散
- **Team.slug**：全局唯一标识，用于域名和 URL 路由
- UserProfile 不承载任何工作属性，保持纯粹

### 开发要求
1. 当发现部分代码冗余设计时，清除冗余设计，而非统一采用冗余风格
2. 项目仍处于开发中，无需考虑旧数据和接口的兼容性。
3. 修改代码时，同步更改 SQL、Swagger/OpenAPI 文档等相关配套文件。
4. 尽量最小改动，不全文件重写
