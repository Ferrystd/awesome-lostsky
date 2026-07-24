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

基于 **ThinkPHP 8** 框架构建的 **纯后端 API 服务**。运行环境要求 PHP 8.1+、MySQL 5.7+ 或 MariaDB 10.3+。

- **[前端](/www/)**：部署在 CDN。后端只返回 JSON，不做 SSR 和页面渲染。

- **多应用**：使用 ThinkPHP 8 多应用模式。一个 App = 一组产品功能入口；现有后端应用包括 `account`、`team`、`display`、`shop`、`transaction`、`chat` 与公共上传入口 `common`。`site` 仅为官网前端，不是后端应用。
- **应用边界**：一个产品一个应用；`account` 是当前唯一不依赖团队上下文的 `teamless_app`，其他团队业务不得自行增加“无团队”分支。

## 事实来源与生成文件

- 当前实现、`docs/openapi/*.openapi.json` 与对应测试共同构成功能事实来源；`docs/apps/` 只记录稳定职责和鉴权边界，`docs/plans/`、`plan/` 与 `docs/TODO.md` 中的内容均不得当作已实现功能。
- OpenAPI 按应用拆分，因为不同应用可以复用相同路径。修改接口时必须同步对应 OpenAPI；`frontend/packages/api/src/generated/*.ts` 由 `npm run generate:api` 生成，禁止手工修改生成文件。纯后端接口改动不运行 npm；只有同时进行前端改动且需要使用新接口契约时，才在该前端任务中生成类型。
- 配置模板维护在 `.env.example` 及 `deploy/` 示例中。不得提交 `.env`、真实 JWT/OSS/Centrifugo/Webhook 密钥，也不得在命令输出、测试日志、变更说明或回复中暴露凭据。

## 前端

### 约定

前端源码位于 `/frontend/`，使用 Vue 3、Vite 与 npm workspace；`npm run build` 后的纯静态产物继续交付到 `/www/`。禁止直接修改构建生成的 HTML/JS/CSS 来代替源码修改。

交互控件优先使用项目已安装的 Naive UI，并通过 `/frontend/packages/ui/src/naive-theme.ts` 统一 LostSky 主题；不要用零散原生 `input/select/textarea` 加临时 CSS 重造已有组件。业务路由按需导入组件，避免让未使用组件库的页面承担初始包体积。

跨应用能力必须放在已有 workspace：API 请求、鉴权和错误类型放在 `@lostsky/api`，主题与通用组件放在 `@lostsky/ui`，导航和无界面业务工具放在 `@lostsky/shared`。禁止在各应用复制一套 API 客户端、登录跳转、枚举转换或 Markdown 渲染逻辑。

业务请求统一经过 `@lostsky/api/client`，不要在页面中直接 `fetch()`。生产环境登录态通过 `.lostsky.work` 跨子域 Cookie 共享；开发或非 LostSky 域名才允许本地存储回退。登录回跳必须使用 `@lostsky/shared/navigation` 的安全跳转函数，只允许站内相对路径或 HTTPS 的 `*.lostsky.work` 地址。

未经净化的服务端或用户 HTML 禁止传给 `v-html`。Markdown 展示复用 `LsMarkdownRenderer.vue`，继续经过 `marked` 与 DOMPurify；新增 Markdown 来源时同时维护后端引用同步、对象解析和删除清理，不能只在前端替换文本。

业务表单默认使用单列字段流并限制可读宽度，桌面端也不得把多个文本输入框横向拼成工具栏。创建、编辑等需要填写多个字段的任务应使用独立路由；弹层只承载简短、低风险的单步输入。

可交互图标不得使用易被误认为禁用的颜色；正常态必须使用清晰、可辨识且满足对比度要求的前景色，与 hover、active、disabled 状态形成差异。偏灰白图标仅用于不可操作的禁用状态。

团队后台页面必须使用 `/frontend/apps/team/src/components/AdminPage.vue` 作为内容容器，并使用 `AdminPageHeader.vue` 生成页面标题、说明、返回入口和操作区。列表页只负责搜索、筛选、概览与进入任务；查看、创建、编辑、审核等任务使用可深链接的独立路由，禁止在列表旁常驻主从编辑器。公开加入页等非后台品牌页面不适用此约束。

### 前端技能

- 新增或修改页面前，读取 `docs/openapi/` 中对应应用的接口定义，并以 OpenAPI 和现有仓库代码作为功能与架构事实来源。
- 使用 `/andrej-karpathy-skills` 约束需求拆解、工程实现和验证，优先选择目标明确、保持简单、局部修改且可按验收标准证明的方案。
- 使用 `/ui-ux-pro-max` 检查无障碍、响应式、表单可用性和动效性能，不采用其自动生成的色板、模板、技术栈或组件选择。
- 使用 `/impeccable` 负责视觉方向、信息层级、交互设计与最终审查；已有 `PRODUCT.md`、`DESIGN.md` 和 Naive UI 主题优先于技能的通用建议。
- 使用 `/shadcn-vue` 检索和借鉴 Vue 组件模式；项目已经提供同类 Naive UI 组件时继续复用 Naive UI，不并行维护重复组件体系。
- `lostsky-frontend` 已永久弃用：保留 `.agents/skills/lostsky-frontend/` 仅供历史追溯，任何新任务均不得调用。
- 不引入 React 运行时。需要借鉴 React 生态的视觉或动效时，必须使用 Vue/CSS 实现，并检查 `prefers-reduced-motion`、移动端性能和键盘可用性。
- 工程实施遵循目标明确、保持简单、局部修改和按验收标准验证；技能建议不得覆盖项目事实、现有组件约定和浏览器测试结果。

### 架构

- 多域名共享的构建资源统一输出到 [`/www/assets.lostsky.work/`](/www/assets.lostsky.work/)；Vite 生产 `base` 固定指向该域名。
- `npm run build` 将各应用 hashed 资源写入 `/www/assets.lostsky.work/build/{app}/`，并按 `frontend/scripts/build.mjs` 的别名表生成 `/www/{domain}/*.html`。新增可直接访问的前端路由时必须同步别名表，否则 CDN 上的深链接会缺少入口 HTML。
- 原始媒体放在 `/frontend/media/source/` 并维护 manifest；应用独有的静态源文件放在对应 `frontend/apps/{app}/public/`。`/frontend/.dist/`、`/frontend/.vite/`、`/www/` 都是派生产物，不作为手工源码。

### CORS 边界

- `api.lostsky.work` 的 CORS 由后端全局 `Cors` 中间件统一处理，禁止在前端静态站点的 Nginx 配置中重复添加 API CORS 规则。
- 只有 `assets.lostsky.work` 的跨域静态资源响应头由前端 Nginx/CDN 配置负责，包括 ES Module、字体、图片、音视频和 Range 请求。
- 前端代码必须为跨域模块或需要匿名跨域读取的资源使用正确的 `crossorigin` 属性；静态资源服务器应返回 `Access-Control-Allow-Origin` 和 `Cross-Origin-Resource-Policy: cross-origin`。

### 前端发布流程

本节命令仅适用于修改 `/frontend/` 源码、前端构建配置或前端生成代码的任务。纯后端、数据库、OpenAPI 文档或后端鉴权变更不得仅因此运行 npm 前端命令，也不得重建 `/www/`。

- 每次修改前端源码后，必须重新执行 `npm run build`，同步更新 `/www/` 中的构建产物。
- 前端发布前在仓库根目录执行 `npm run typecheck`、`npm run test:e2e`，再执行 `npm run build`；纯后端发布不执行这些 npm 命令。
- `npm run build` 会把官网、账户、团队后台、聊天和记账应用的生产产物发布到 `/www/`；提交 Git 时源码和构建产物一并提交。
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

### 多应用路由与团队上下文

- 对外路由必须显式声明在 `app/{app}/route/app.php`；`route/app.php` 只负责全局应用和团队解析。虽然 `url_route_must=false` 允许框架回退到控制器动作，但新接口不得依赖自动路由。
- 路由参数必须按真实类型添加 `pattern()` 约束，并与控制器取参方式、OpenAPI 的 path/query/body 定义保持一致。修改路径时同时检查前端调用、静态 HTML 深链接和端到端测试。
- `AppResolver` 从标准 Host、前端 Origin 或 `team_domain` 自定义域名解析应用与团队，并把 `team`、`team_id`、`slug` 写入请求；控制器和服务不得根据用户输入重新推断团队。自定义域名或团队有效状态变更时要处理最长 3600 秒的缓存失效。
- 全局顺序固定为 `Cors → AppResolver → MultiApp → Dedup`。应用控制器再按需组合 `JwtAuth → Context → 成员/客户身份 → Ability/Access/Verify/Permission`；`Context` 只补充上下文，不代替授权。

### 模型层规范

统一继承 `app\model\Base`（而非 `think\Model`或`think\Db`）。
项目禁止使用 `think\facade\Db` 查询或写入业务数据；仅允许使用 `Db::transaction()` 管理跨模型事务，事务内的数据操作仍须通过模型完成。
`Base` 提供能力：

- **自动时间戳**
- **软删除**：业务删除调用模型 `delete()`，由 `SoftDelete` 自动写入 `delete_time`；无需手写 `delete_time` 条件。只有恢复、去重或永久占位等明确场景才使用 `withTrashed()`、`restore()`，禁止用 `Db` 物理删除业务数据。

开发约定：

- **字段类型转换**：在 `$type` 数组中声明字段类型映射（`'id' => 'integer'` 等），可能使用`$json`
- **枚举字段**：固定选项使用原生 `BackedEnum`，模型 `$type` 直接声明枚举类。无中文展示需求时由 `Base::$enumReadName = true` 自动输出 case name；需要中文展示时才实现 `EnumTransform`，在 `value()` 中用 `match` 返回文案。模型保存时传枚举实例，查询条件使用枚举底层 `->value`，业务判断需要枚举实例时使用模型 `enumCase()`；禁止为单个字段重复编写枚举获取器、修改器或手动文案映射。
- **前端枚举表单**：全局生效，固定枚举必须使用选择控件和同一组选项，展示接口返回的 case name 或文案时，通过 `@lostsky/ui/lib/enum` 的 `enumOptionValue()` 自动还原为提交底层值；禁止将枚举展示值交给数字输入框或直接 `Number()` 强转。新增枚举表单时同步覆盖“底层值、case name、展示文案”三种回填输入。
- **数据库字符集**：`utf8mb4`，排序规则 `utf8mb4_unicode_ci`，引擎 `InnoDB`
- **关联**：使用`hasOne()`,`bind()`,`belongTo`等关联，而非手动写逻辑
- **命名空间**：`app\model`。
- **跨表默认数据**：保留空数据+获取器兜底，而非频繁用复制解决字段默认值。
- **文件模板**：使用`make:model`可建构`$type`,`$hidden`等数组
- **隐藏字段**：子模型覆盖 `$hidden` 时必须继续隐藏 `delete_time`，不得把软删除元数据暴露到 API。
- **字段命名**：最简，如`customer_id`代替`team_customer_id`
- **不随意写独立方法**：优先用获取器、修改器、搜索器，再不济也用scope语法糖等
- **能null则null**：不用0,''替代null语义。若需要null，为避免报错，使用`//'field' => 'null|integer'`注释占位
- **数据计算**：交给数据库，禁止在php侧计算
- **团队隔离**：团队业务的读取、更新和删除必须在查询中同时限定 `team_id`，关联 ID 也必须验证属于当前团队；不能先按裸 ID 取模型再仅依赖前端隐藏。
- **并发一致性**：余额、去重、唯一单聊等竞争写入必须依赖数据库唯一约束或在 `Db::transaction()` 内使用行锁；禁止用“先查后写”的 PHP 判断冒充并发保护。

### 中间件体系

- 在 `config/middleware.php` 注册别名。
- 使用别名，禁用完整类名，简化代码。
- 命名:
+ `{$app}Ability`:团队能力
+ `{$app}Access`:管理员身份确认
+ `{$app}Verify`:成员身份确认

#### 防重放攻击、多次点击：

1. **Dedup**：非 GET 请求优先使用每次操作唯一的 `X-Request-Id` 防重放；`X-Page-Id + 请求内容` 仅用于兼容同一页面的重复提交。失败响应会释放哈希，客户端不得用固定 Request ID 重试不同操作。

#### 鉴权流程：
1. **Cors**
2. **AppResolver / MultiApp**：确定应用与团队
3. **Dedup**：过滤需要保护的重复写请求
4. **JwtAuth** :JWT 认证中间件，确定用户
5. **Context** :进一步提取 user_id、team_id、member_id、customer_id
6. 团队能力鉴权（例）
+ **TransactionAbility**:记账能力校验
7. 成员访问鉴权（例）
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
- **错误响应**：`app\ExceptionHandle` 负责把验证、HTTP 和未捕获异常统一为 JSON 并补 CORS；生产环境不得把堆栈、SQL、内部主机或第三方密钥拼进对外错误。
- **分页响应**：列表接口沿用 `{total, list, page, limit}`，页码和条数在控制器转为整数；不要为单个应用创造另一套分页信封。
- **部分更新**：只写请求中明确出现且通过白名单和验证的字段，不能用缺省值覆盖未提交字段。

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

### 数据库与接口同步

- `sql/schema.sql` 表示全新安装的完整最终结构；`sql/patches/YYYYMMDD_*.sql` 表示已有数据库的增量路径。表、字段、索引或数据语义变化时两者必须同步，补丁应可审查、按日期命名，并明确事务边界。
- 执行 SQL 前只读取必要的数据库配置并核对库名和现有表，禁止输出密码。执行后用只读查询验证列、索引、枚举值或迁移行数；失败时保留完整错误，但对外报告须脱敏。
- 接口变更按 `路由 → 控制器/服务 → OpenAPI → 后端测试` 的链路核对；只有同时修改前端时，才继续核对 `npm run generate:api → 前端调用 → 前端测试`。生成类型与 OpenAPI 不一致时修正文档或实现，不在生成文件中打补丁。
- 新应用除代码外还要补 `docs/apps/{app}.md`、`docs/openapi/{app}.openapi.json`、`package.json` 类型生成脚本；有前端时再补 Vite 配置、build 别名/域名和 Playwright webServer。

### 验证要求

- 按改动范围运行最小但充分的验证：PHP 文件至少执行 `php -l`；后端业务执行对应 PHP 集成测试，不为运行后端测试调用 npm 包装脚本；前端逻辑才执行 `npm test` 与 `npm run typecheck`。
- 只有页面、前端路由、响应式或前端登录流程变化才执行 `npm run test:e2e`；媒体与跨域构建变化另执行 `npm run check:media`、`npm run check:cors`。前端源码最终仍必须执行 `npm run build` 并检查 `/www/` 差异。
- 数据库集成测试会创建并清理测试数据，运行前必须确认 `.env` 指向允许测试的 LostSky 数据库；不得对未知或生产数据库直接运行破坏性测试。
- 只修改文档时无需重建前端，但要检查链接、命令、路径、版本号和 UTF-8 无 BOM；不得宣称未实际运行的测试通过。

## Chat 动态资源权限

- `TeamSetting` 只管理团队策略；权限 key 管理成员是否可以执行具体操作，团队创建者在 Chat 中不绕过权限。
- 动态资源控制器只声明具体模板，例如 `Permission:chat.virtual.<slug>.manage`；`Permission` 从路由、查询或请求体解析参数，并由 `PermissionGate` 同时精确检查 `chat.virtual.{slug}.manage` 与 `chat.virtual.*.manage`。
- `Permission` 可用逗号接收多个权限参数，例如 `Permission:key-a,key-b`；多个参数按 OR 处理，任一参数展开后的具体权限或 `*` 通用权限命中即可放行。
- `*` 只能作为完整资源范围段，表示该类型的全部实例，不执行前缀或模糊匹配；业务 slug 不得提交为 `*`。
- slug 用于 URL、公开标识和动态权限；数据库数字 ID 继续作为内部主键和外键，不进入动态权限 key。

## Chat 实时事件与 Webhook

- 会话或消息业务事务只写 `chat_event_outbox`；Centrifugo 发布和 Webhook 网络请求由 `php think chat:worker` 异步处理。不得在核心写事务内直接请求外部服务，否则外部故障会破坏业务提交。
- outbox 和投递记录必须可重试、可去重并保留失败信息；来源集成不得收到自己触发事件的回环投递。事件类型变化时同步更新允许列表、payload、OpenAPI、前端消费和后端测试。
- Webhook 端点只允许可解析到公网地址的 HTTPS，并继续通过固定 DNS 解析结果发送，禁止跟随重定向或放宽到内网、保留地址；令牌只保存哈希，明文 token 与签名密钥只在创建或轮换时返回。
- Centrifugo 连接和订阅 JWT 均为短期令牌，订阅前必须再次校验会话访问权。WebSocket Nginx 配置只代理 `/connection/websocket`，不能接管 ThinkPHP API CORS。
- 生产环境需持续运行 `chat:worker`，并定时执行 `php think chat:cleanup` 关闭过期临时会话和落实消息保留策略；新增 Chat 持久化能力时同时评估清理策略。
