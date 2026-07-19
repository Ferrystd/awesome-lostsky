# AGENTS.md

## 文本编码与中文防乱码

所有文件统一使用 **UTF-8 无 BOM** 保存，禁止使用其他编码重新保存。

尽量不使用终端，而是使用编辑器原生能力查看与编辑文件。
必须使用且 Windows/PowerShell 下查看中文时，如果终端显示乱码，不得转码；应先用 `rg` 或其他**UTF-8**编辑器和脚本读取确认。
HTML 必须保留 `<meta charset="UTF-8">`

## 日志

除非特殊要求，默认正在制作的版本是相对 Git 最新发布标签的下一个补丁版本，即 `v0.0.N → v0.0.(N+1)`。
每次进行代码编辑，自动在[日志](/CHANGELOG.md)对应的待发布版本中记录变更。

根目录 [package.json](/package.json) 的 `version` 是项目待发布版本的机器可读来源；发布时它必须与 `package-lock.json`、`CHANGELOG.md` 最新版本标题和 Git 标签一致。`frontend/packages/*` 均为内部私有 workspace，不设置独立产品版本号。

当用户要求“上传新版本”“发布新版本”或“推送新版本”时，必须委派给 `lostsky-git` 子代理执行发布流程。发布标签统一使用附注标签；禁止移动已有标签、强制推送或重复发布已有版本。

## 项目概况

基于 **ThinkPHP 8** 框架构建的 **纯后端 API 服务**。运行环境要求 PHP 8.0+。

- **[前端](/www/)**：部署在 CDN。后端只返回 JSON，不做 SSR 和页面渲染。

- **多应用**：使用 ThinkPHP 8 多应用模式。一个 App = 一组功能入口（如 `console` 控制台、`account` 认证）。该项目只提供API服务。一个产品一个应用

## 前端

### 约定

前端源码位于 `/frontend/`，使用 Vue 3、Vite 与 npm workspace；`npm run build` 后的纯静态产物继续交付到 `/www/`。禁止直接修改构建生成的 HTML/JS/CSS 来代替源码修改。

交互控件优先使用项目已安装的 Naive UI，并通过 `/frontend/packages/ui/src/naive-theme.ts` 统一 LostSky 主题；不要用零散原生 `input/select/textarea` 加临时 CSS 重造已有组件。业务路由按需导入组件，避免让未使用组件库的页面承担初始包体积。

业务表单默认使用单列字段流并限制可读宽度，桌面端也不得把多个文本输入框横向拼成工具栏。创建、编辑等需要填写多个字段的任务应使用独立路由；弹层只承载简短、低风险的单步输入。

可交互图标不得使用易被误认为禁用的颜色；正常态必须使用清晰、可辨识且满足对比度要求的前景色，与 hover、active、disabled 状态形成差异。偏灰白图标仅用于不可操作的禁用状态。

团队后台页面必须使用 `/frontend/apps/team/src/components/AdminPage.vue` 作为内容容器，并使用 `AdminPageHeader.vue` 生成页面标题、说明、返回入口和操作区。列表页只负责搜索、筛选、概览与进入任务；查看、创建、编辑、审核等任务使用可深链接的独立路由，禁止在列表旁常驻主从编辑器。公开加入页等非后台品牌页面不适用此约束。

### 新增
读取`docs/openapi/`中所需要的json，使用 `/ui-ux-pro-max`,`/lostsky-frontend` 构建页面

### 修改
使用`/ui-ux-pro-max`修改页面，不使用`/lostsky-frontend`

### 架构
一切多域名复用文件存储在[](/www/assets.lostsky.work/)。
单域名复用文件存储在各自`/assets/`文件夹

### CORS 边界

- `api.lostsky.work` 的 CORS 由后端全局 `Cors` 中间件统一处理，禁止在前端静态站点的 Nginx 配置中重复添加 API CORS 规则。
- 只有 `assets.lostsky.work` 的跨域静态资源响应头由前端 Nginx/CDN 配置负责，包括 ES Module、字体、图片、音视频和 Range 请求。
- 前端代码必须为跨域模块或需要匿名跨域读取的资源使用正确的 `crossorigin` 属性；静态资源服务器应返回 `Access-Control-Allow-Origin` 和 `Cross-Origin-Resource-Policy: cross-origin`。

### 前端发布流程

- 每次修改前端源码后，必须重新执行 `npm run build`，同步更新 `/www/` 中的构建产物。
- 发布前在仓库根目录执行 `npm run typecheck`、`npm run test:e2e`，再执行 `npm run build`。
- `npm run build` 会把官网、账户、团队后台的生产产物发布到 `/www/`；提交 Git 时源码和构建产物一并提交。
- Git 远端推送只负责版本同步，不代替服务器部署；宝塔/Nginx 的实际站点配置由维护者手动应用，尤其是 `assets.lostsky.work` 的跨域响应头和缓存策略。
- 发布后若浏览器仍加载旧的 hashed asset，先刷新 CDN 缓存，再使用强制刷新验证，不要直接修改 `www/` 中的构建文件。

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
- **枚举字段**：固定选项使用原生 `BackedEnum`，模型 `$type` 直接声明枚举类。无中文展示需求时由 `Base::$enumReadName = true` 自动输出 case name；需要中文展示时才实现 `EnumTransform`，在 `value()` 中用 `match` 返回文案。模型保存时传枚举实例，查询条件使用枚举底层 `->value`，业务判断需要枚举实例时使用模型 `enumCase()`；禁止为单个字段重复编写枚举获取器、修改器或手动文案映射。
- **前端枚举表单**：全局生效，固定枚举必须使用选择控件和同一组选项，展示接口返回的 case name 或文案时，通过 `@lostsky/ui/lib/enum` 的 `enumOptionValue()` 自动还原为提交底层值；禁止将枚举展示值交给数字输入框或直接 `Number()` 强转。新增枚举表单时同步覆盖“底层值、case name、展示文案”三种回填输入。
- **数据库字符集**：`utf8mb4`，排序规则 `utf8mb4_unicode_ci`，引擎 `InnoDB`
- **关联**：使用`hasOne()`,`bind()`,`belongTo`等关联，而非手动写逻辑
- **命名空间**：`app\model`。
- **跨表默认数据**：保留空数据+获取器兜底，而非频繁用复制解决字段默认值。
- **文件模板**：使用`make:model`可建构`$type`,`$hidden`等数组
- **字段命名**：最简，如`customer_id`代替`team_customer_id`
- **不随意写独立方法**：优先用获取器、修改器、搜索器，再不济也用scope语法糖等
- **能null则null**：不用0,''替代null语义。若需要null，为避免报错，使用`//'field' => 'null|integer'`注释占位
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
**Permission**:特殊权限校验

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
5. 新增或修改 SQL 补丁后，默认直接读取项目根目录 `.env` 的数据库配置并执行，避免手动执行；执行前确认数据库与项目匹配，执行后校验结果。