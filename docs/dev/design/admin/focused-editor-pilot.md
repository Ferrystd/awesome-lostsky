# 专注编辑：全页面实施与批阅

用户后续明确要求“完成所有页面并给出预览，不新建子代理”。本记录取代此前的单实例范围：按当前共享工作台归属表，完成 Team 9、Admin 5、Transaction 3、Weibo 5、Shop manage 2，共 24 个 view。未扩大到其他模板所有者的页面。

## 设计与业务边界

- 复用既有 `LsFormPage`、`LsFormSection`、字段、动态列表、上传与提交区，不复制外壳，不新增共享组件视觉参数或默认样式。页面只持有业务分组、顺序与布局。
- 保留极光、透光面板、按钮/输入主题及角色回退。未修改 App、Shell、router/meta、全局 CSS、公共 demo 或其他模板。
- 普通表单沿用应用 form 档 42rem（672px）；原 content 档的长文与混合管理分支不在子页面重复限宽或擅改路由。
- 简单表单保持紧凑；较长表单采用逻辑区块，主体单列。商品长表单保留章节点位，点击后聚焦对应标题，不改变路由或提交草稿。
- 不把原子保存改成向导或逐段提交。群聊、成员管理和活动兑换码中的原有独立动作继续独立；上传、权限、校验、API、草稿与确认语义保持。
- 本轮业务脚本只新增商品页章节聚焦函数；其余脚本差异为现有组件导入。不得把这项源码范围声明当成完整业务回归。
- 移动端、键盘、放大文字与减少动态继续沿用公共组件能力；这轮只输出桌面预览，尚未进行多尺寸与交互验收。

## 全部归属页面

源码相对 `frontend/apps/<应用>/src/views/`；Shop 文件位于 `manage/`。每行已实施，预览列为真实路由渲染场景数。数字路由参数沿用原 router 约束。

| 应用 | 实际路由（含示例参数） | 源码 | 归类与实施内容 | 状态 / 预览 |
| --- | --- | --- | --- | --- |
| team | `/chat-groups/new`、`/chat-groups/preview-group` | `ChatGroupView.vue` | 创建按资料、首批邀请组织；管理分支保留资料保存、邀请、成员和历史消息的独立动作。 | 已实施，2 个场景 |
| team | `/chat-virtual-new`、`/chat-virtual?slug=sky-helper` | `ChatVirtualFormView.vue` | 人员资料集中编辑，保存归入底部动作区；编辑分支继续展示 Webhook 集成目录。 | 已实施，2 个场景 |
| team | `/chat-integration-new?slug=sky-helper`、`/chat-integration?slug=sky-helper&id=7` | `ChatIntegrationFormView.vue` | 连接与事件为一组编辑内容；保存、轮换凭据与一次性凭据展示保持原边界。 | 已实施，2 个场景 |
| team | `/field-new`、`/field-edit?id=7` | `EntityFieldFormView.vue` | 字段定义、访问与维护规则、填写要求与排序分段，统一提交。 | 已实施，2 个场景 |
| team | `/roles/new` | `RoleFormView.vue` | 仅负责角色创建资料；角色权限编辑仍由分类工作区负责。 | 已实施，1 个场景 |
| team | `/join-fields/new`、`/join-fields/7` | `JoinFieldFormView.vue` | 字段定义、申请表规则、审批后转存分段；选项的名称和值采用单列。 | 已实施，2 个场景 |
| team | `/member-add`、`/member-edit?id=7` | `MemberFormView.vue` | 新建的添加动作移到表单底部；编辑分支保留对象字段、权限和成员管理的独立提交。 | 已实施，2 个场景 |
| team | `/doc-create?entity_id=71`、`/doc-edit?id=7` | `DocumentFormView.vue` | 资料、正文、访问规则分段；访问字段单列，保留原 Markdown 与上传能力。 | 已实施，2 个场景 |
| team | `/notices/send` | `NoticeSendView.vue` | 收件人员与通知内容分段；发送仍为一次操作，底部保留发送及取消。 | 已实施，1 个场景 |
| admin | `/administrators/new`、`/administrators/7` | `AdministratorFormView.vue` | 明确用户与角色为同一任务，保留紧凑表单和底部保存。 | 已实施，2 个场景 |
| admin | `/entitlements/team-abilities?team=demo` | `TeamAbilityGrantView.vue` | 授权对象、能力与有效期、确认授权分段，保留覆盖旧手工授权的说明。 | 已实施，1 个场景 |
| admin | `/entitlements/packages/new`、`/entitlements/packages/7` | `EntitlementPackageFormView.vue` | 能力条目采用单列，保留动态增删与统一保存。 | 已实施，2 个场景 |
| admin | `/site-content` | `SiteContentView.vue` | 备案、核心人员、优势数据分别成段，仍为一次原子保存。 | 已实施，1 个场景 |
| admin | `/entitlements/campaigns/new`、`/entitlements/campaigns/7` | `EntitlementCampaignView.vue` | 活动内容与领取规则分段；编辑分支独立发行体验码和管理代码，补齐发行字段标签。 | 已实施，2 个场景 |
| transaction | `/personal/transactions/new`、`/edit?id=7` | `TransactionFormView.vue` | 参与方、支付、分成、交易信息保持顺序；区块标题层级一致，底部集中核对并保存。 | 已实施，2 个场景 |
| transaction | `/entitlements/new`、`/personal/entitlements/new` | `EntitlementGrantView.vue` | 顾客与权益集中填写，底部确认；待确认重试保持原幂等恢复路径。 | 已实施，2 个场景 |
| transaction | `/recharge?customer_id=81` | `RechargeView.vue` | 顾客、余额与充值金额相邻，底部独立确认本次充值。 | 已实施，1 个场景 |
| weibo | `/accounts/bind`、`/personal/accounts/bind` | `AccountBindingView.vue` | 验证账号/填写验证码按原状态展示，底部执行当前动作，不新增步骤。 | 已实施，2 个场景 |
| weibo | `/interactions/comment-presets/new`、`/interactions/comment-presets/edit`、`/personal/interactions/comment-presets/new`、`/personal/interactions/comment-presets/edit` | `CommentPresetFormView.vue` | 团队/个人预设保留动态列表，底部明确整份列表统一保存。 | 已实施，4 个场景 |
| weibo | `/interactions`、`/personal/interactions` | `InteractionView.vue` | 操作与目标、账号与内容、确认互动分段；仍为一次手动点赞或评论。 | 已实施，2 个场景 |
| weibo | `/compose`、`/personal/compose` | `OperationView.vue` | 保持账号、内容、可选图片和发布前确认的顺序，保留真实上传与发布语义。 | 已实施，2 个场景 |
| weibo | `/tasks/new`、`/tasks/7`、`/personal/tasks/new`、`/personal/tasks/7` | `TaskFormView.vue` | 任务与账号、执行时间、内容、保存任务分段；保存后仍为暂停状态。 | 已实施，4 个场景 |
| shop | `/manage/products/new`、`/manage/products/7`、`/manage/personal/products/new`、`/manage/personal/products/7` | `manage/ProductFormView.vue` | 资料、交付、价格分成、详情、上架保存五章，单列；全部商品类型仍由原条件分支管理。 | 已实施，4 个场景 |
| shop | `/manage/orders/new` | `manage/OrderFormView.vue` | 商品顾客、购买资料、参与方、订单备注依次排列，最后创建订单。 | 已实施，1 个场景 |

## 混合页面与不能强塞的范围

实际源码核对修正了单实例阶段的候选判断：Admin 官网内容是一次整页提交，可采用专注编辑；Weibo 互动是一次明确的手动操作，也能按目标、内容和确认组织，不需要为名称另造模板。

| 页面 | 处理方式 / 模板需求 |
| --- | --- |
| Team 群聊管理 `/chat-groups/:uuid` | 同源文件已处理，但保留成员、邀请与历史消息区域，不宣称整页只有一次保存。 |
| Team 成员管理 `/member-edit?id=7` | 已处理所属文件，保留字段、角色、状态与身份的独立动作；不能合成虚假的“保存全部”。 |
| Team 虚拟人员编辑 `/chat-virtual?slug=sky-helper` | 资料表单与集成目录共存，保留目录入口，不强塞成单字段段落。 |
| Admin 活动详情 `/entitlements/campaigns/:id` | 活动表单、发行和代码目录分别保留；发行不隐式保存活动。 |
| Team 文档创建/编辑 | 本轮保留原编辑器及较宽路由；如未来要求目录或分屏写作，应另定义“长文创作”变体，而非挤进窄幅字段区。 |
| Team/Admin 角色权限、个人分类工作区 | 不属于本轮所有权；不改角色详情、人员角色分配或 Admin 角色页。 |
| Team/Admin 社区创建、详情和治理 | 同源文件归中央所有者，本轮不修改。 |
| 顾客详情、对象目录、总览分析 | 分属其他模板，本轮不修改。 |
| Shop 顾客前台、Team `/join`、其他公开页面 | 不属于本轮内部工作台范围。 |

简单弹窗、上传、添加子项等不计为独立页面。没有有效路由的旧 Shop 服务/套餐/活动文件不激活。本轮实际 24 个 view 无需新增第六类模板；上述未来长文创作需求尚未实施。

## 真实预览与交付证据

- 命令：`node test-results/focused-editor/render-all.mjs`。按应用串行启动本工作区 Vite，渲染真实 App/Shell/路由，浏览器视口 1440×1000，输出整页截图。
- 覆盖：24 个 view、48 个实际路由场景。Team 16、Admin 8、Transaction 5、Weibo 14、Shop 5。新建与编辑、团队与个人入口都在图库中。
- 商品、人员、权限、余额、代码、评论与业务内容为模拟。预览页均有模拟标记，浏览器拒绝真实后端写入及外部请求；没有实际保存、发通知、充值、发帖、发行代码或发送验证码。
- 首轮成员预览因夹具缺失 `status_code` 未完成；已修正模拟数据并重出该页。预设评论补齐 `scope` 后重出四个新建/编辑场景。最终 manifest 的 48 项均有图片，页面脚本异常和缺失模拟接口均为空。
- 图库：`test-results/focused-editor/all-pages/index.html`；清单：同目录 `manifest.json`；每张 PNG 与 route 一一对应。图片只供人类批阅，本实例未打开、OCR 或据像素调整。
- `LsFormSection` 组件状态矩阵由 `npm run preview:components -- --component LsFormSection --json` 生成，位于 `frontend/component-previews/generated/`，只供人类查看。
- 按用户节约 token 的要求，未运行测试套件、typecheck、全量静态发布构建或后端验收。真实渲染证明页面能以模拟数据生成预览，不能替代上传、权限、草稿恢复、金额计算、真实提交和多尺寸回归。

## 工作区与生命周期

- 任务分支：`codex/focused-product-editor`。任务 HEAD/创建基线：`0c8589512de78854003550a212967ba63ee574b3`。
- 本轮开始时主工作区干净，main 已至 `c937a58ae85930ca3507dddd786134fbef616141`，其新增差异是公共应用规范及 TeamSettingsGroup，不涉及本轮页面；未合入或覆盖这些他人改动。
- 文件所有权：上述 24 个 view 与本独立说明。只按明确文件暂存；没有修改共享主题、路由、公共总表、Changelog 或人工用户文档。
- 生命周期：已完成但等待审查。保持本地暂存、未提交；因本轮未执行提交验收门禁，不绕过 hooks 制作“已验收”提交。未合 main、未 push、未部署、未删除环境。
- 忽略提交的渲染脚本、预览图片与本地依赖 junction 保留在任务工作区；图库只绑定本机回环地址。
