# 全页面模板归属清单

状态：总览分析候选的 11 个路由均已实施，等待批阅。2026-10-17，本任务已在独立分支合入 main `b120a821` 作为开发基线，未反向合并到 main。总览之外的归属与实施标记沿用 2026-10-16 的路由盘点，不据此判断其他聊天当前的完成进度。

本轮仅处理总览分析：Team `/`、`/personal`；Admin `/`、`/system`；Transaction `/overview`、`/personal`、`/stats`；Weibo `/overview`、`/personal`；Shop `/manage`、`/manage/personal`。Team `PersonalView` 只改变 overview 分支，保留最新 main 的资料、字段与权限分支。下列待新增类保留，供第六模板或其他专用模板另行评估；本轮未将任何总览候选强行迁入它们。

## 计数口径

- 按应用 + 展开后的路由模式计数，同一 Vue 被不同路由复用分别计数；参数值、查询参数、hash 与实际团队数量不展开。社区治理的 section 枚举与可选 itemId 是一个路由模式，其所有分支均由该行覆盖。
- 微博 scoped 的团队/个人两套路由分别展开；Site 没有 Vue Router，以唯一 App.vue 入口 / 计一页。
- 保留有实际结果界面的 404、拒绝访问与身份回跳页；纯 redirect 及 Chat /profile 的 beforeEnter 跳转不计页面，另列映射。
- 共 191 条入口记录；11 条仅跳转。**实际页面 180 = 五类归属 144 + 待新增类 36**。这不是不同 Vue 文件数量。

| 归属 | 页面数 |
| --- | ---: |
| 分类工作区 | 12 |
| 对象目录 | 38 |
| 对象档案 | 24 |
| 专注编辑 | 59 |
| 总览分析 | 11 |
| 待新增类 | 36 |

## 判定边界

分类工作区按稳定业务范围切换；对象目录先找对象；对象档案先理解单个对象及其关系；专注编辑围绕一次明确提交；总览分析先理解现状或选择主要工作入口。小型指标、局部表单与 tabs 不单独决定页面类别。五类仅定义信息组织，不能据此替换公开/顾客页面的原视觉体系。

已有模板以当前源码与 [对象目录实施记录](customer-directory-pilot.md) 为据：Team 设置、团队通知与审计使用分类布局；顾客、成员、文档与 Shop 两种商品目录已有对象目录。Team 个人通知仍无分类布局，保留拟归属。

以下每张表标题给出应用和实际 origin；路由必须与该 origin 组合，避免混淆同名路径。源码均为真实路由指向的页面入口。

## account — account.lostsky.work（8 页）

路由来源：frontend/apps/account/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/login` | 登录 | [views/LoginView.vue](../../../frontend/apps/account/src/views/LoginView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |
| `/recovery` | 账号恢复 | [views/RecoveryView.vue](../../../frontend/apps/account/src/views/RecoveryView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |
| `/register` | 注册 | [views/RegisterView.vue](../../../frontend/apps/account/src/views/RegisterView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |
| `/teams` | 我的团队 | [views/TeamsView.vue](../../../frontend/apps/account/src/views/TeamsView.vue) | 对象目录 | 定位已加入的团队，再进入团队工作台 | 拟归属，未实施 |
| `/identity` | 选择身份 | [views/IdentityView.vue](../../../frontend/apps/account/src/views/IdentityView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |
| `/identity/member-callback` | 领取成员身份 | [views/MemberIdentityCallbackView.vue](../../../frontend/apps/account/src/views/MemberIdentityCallbackView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |
| `/identity/workspace-warning` | 外部身份提醒 | [views/WorkspaceWarningView.vue](../../../frontend/apps/account/src/views/WorkspaceWarningView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |
| `/identity/current/:section?` | 正在打开工作台 | [views/CurrentEntityRedirectView.vue](../../../frontend/apps/account/src/views/CurrentEntityRedirectView.vue) | 待新增类 | 身份流程：登录、恢复、注册或选择/领取身份，存在跨应用回跳 | 建议新增，未实施 |

## admin — admin.lostsky.work（28 页）

路由来源：frontend/apps/admin/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/communities` | 平台社区 | [views/CommunitiesView.vue](../../../frontend/apps/admin/src/views/CommunitiesView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/communities/new` | 创建社区 | [views/CommunitiesView.vue](../../../frontend/apps/admin/src/views/CommunitiesView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/communities/:id(\d+)` | 社区详情 | [views/CommunitiesView.vue](../../../frontend/apps/admin/src/views/CommunitiesView.vue) | 对象档案 | 围绕一个已选对象理解状态与管理关系 | 拟归属，未实施 |
| `/communities/:id(\d+)/edit` | 编辑社区 | [views/CommunitiesView.vue](../../../frontend/apps/admin/src/views/CommunitiesView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/communities/:id(\d+)/administrators` | 社区管理员 | [views/CommunitiesView.vue](../../../frontend/apps/admin/src/views/CommunitiesView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/communities/:id(\d+)/manage/:section(boards&#124;announcements&#124;posts&#124;comments&#124;members)/:itemId?` | 社区管理 | [views/CommunitiesView.vue](../../../frontend/apps/admin/src/views/CommunitiesView.vue) | 分类工作区 | 按稳定管理范围查看记录或治理内容 | 拟归属，未实施 |
| `/` | 平台总览 | [views/DashboardView.vue](../../../frontend/apps/admin/src/views/DashboardView.vue) | 总览分析 | 先看平台关键状态，再进入管理动作 | 已实施，待批阅 |
| `/users` | 用户 | [views/UsersView.vue](../../../frontend/apps/admin/src/views/UsersView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/users/:id(\d+)` | 用户详情 | [views/UserDetailView.vue](../../../frontend/apps/admin/src/views/UserDetailView.vue) | 对象档案 | 围绕一个已选对象理解状态与管理关系 | 拟归属，未实施 |
| `/teams` | 团队 | [views/TeamsView.vue](../../../frontend/apps/admin/src/views/TeamsView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/teams/:id(\d+)` | 团队详情 | [views/TeamDetailView.vue](../../../frontend/apps/admin/src/views/TeamDetailView.vue) | 对象档案 | 围绕一个已选对象理解状态与管理关系 | 拟归属，未实施 |
| `/entitlements/team-abilities` | 团队能力 | [views/TeamAbilityGrantView.vue](../../../frontend/apps/admin/src/views/TeamAbilityGrantView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/administrators` | 平台管理员 | [views/AdministratorsView.vue](../../../frontend/apps/admin/src/views/AdministratorsView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/administrators/new` | 添加平台管理员 | [views/AdministratorFormView.vue](../../../frontend/apps/admin/src/views/AdministratorFormView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/administrators/:userId(\d+)` | 管理员角色 | [views/AdministratorFormView.vue](../../../frontend/apps/admin/src/views/AdministratorFormView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/roles` | 平台角色 | [views/RolesView.vue](../../../frontend/apps/admin/src/views/RolesView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/roles/new` | 创建平台角色 | [views/RoleFormView.vue](../../../frontend/apps/admin/src/views/RoleFormView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/roles/:id(\d+)` | 编辑平台角色 | [views/RoleFormView.vue](../../../frontend/apps/admin/src/views/RoleFormView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/audit` | 审计日志 | [views/AuditView.vue](../../../frontend/apps/admin/src/views/AuditView.vue) | 分类工作区 | 按稳定管理范围查看记录或治理内容 | 拟归属，未实施 |
| `/system` | 系统状态 | [views/SystemView.vue](../../../frontend/apps/admin/src/views/SystemView.vue) | 总览分析 | 先看平台关键状态，再进入管理动作 | 已实施，待批阅 |
| `/site-content` | 官网内容 | [views/SiteContentView.vue](../../../frontend/apps/admin/src/views/SiteContentView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/entitlements/packages` | Ability 权益包 | [views/EntitlementPackagesView.vue](../../../frontend/apps/admin/src/views/EntitlementPackagesView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/entitlements/packages/new` | 创建 Ability 权益包 | [views/EntitlementPackageFormView.vue](../../../frontend/apps/admin/src/views/EntitlementPackageFormView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/entitlements/packages/:id(\d+)` | 编辑 Ability 权益包 | [views/EntitlementPackageFormView.vue](../../../frontend/apps/admin/src/views/EntitlementPackageFormView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/entitlements/campaigns` | Ability 体验活动 | [views/EntitlementCampaignsView.vue](../../../frontend/apps/admin/src/views/EntitlementCampaignsView.vue) | 对象目录 | 按名称/状态定位可管理对象 | 拟归属，未实施 |
| `/entitlements/campaigns/new` | 创建 Ability 体验活动 | [views/EntitlementCampaignView.vue](../../../frontend/apps/admin/src/views/EntitlementCampaignView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/entitlements/campaigns/:id(\d+)` | Ability 体验活动 | [views/EntitlementCampaignView.vue](../../../frontend/apps/admin/src/views/EntitlementCampaignView.vue) | 专注编辑 | 围绕单一配置或授权任务填写并提交 | 拟归属，未实施 |
| `/forbidden` | 没有访问权限 | [views/ForbiddenView.vue](../../../frontend/apps/admin/src/views/ForbiddenView.vue) | 待新增类 | 系统结果：访问受限说明与恢复路径 | 建议新增，未实施 |

## chat — chat.lostsky.work（3 页）

路由来源：frontend/apps/chat/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/` | 消息 | [views/ChatView.vue](../../../frontend/apps/chat/src/views/ChatView.vue) | 待新增类 | 会话协作：会话列表、消息流或会话建立/邀请治理，不是静态对象管理 | 建议新增，未实施 |
| `/requests` | 邀请与屏蔽 | [views/RequestsView.vue](../../../frontend/apps/chat/src/views/RequestsView.vue) | 待新增类 | 会话协作：会话列表、消息流或会话建立/邀请治理，不是静态对象管理 | 建议新增，未实施 |
| `/new` | 新会话 | [views/NewConversationView.vue](../../../frontend/apps/chat/src/views/NewConversationView.vue) | 待新增类 | 会话协作：会话列表、消息流或会话建立/邀请治理，不是静态对象管理 | 建议新增，未实施 |

## community — community.lostsky.work（7 页）

路由来源：frontend/apps/community/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/` | 社区广场 | [views/CommunitiesView.vue](../../../frontend/apps/community/src/views/CommunitiesView.vue) | 待新增类 | 社区阅读：公开内容发现、帖子阅读与讨论流 | 建议新增，未实施 |
| `/mine` | 我加入的社区 | [views/CommunitiesView.vue](../../../frontend/apps/community/src/views/CommunitiesView.vue) | 待新增类 | 社区阅读：公开内容发现、帖子阅读与讨论流 | 建议新增，未实施 |
| `/c/:slug` | 社区 | [views/CommunityView.vue](../../../frontend/apps/community/src/views/CommunityView.vue) | 待新增类 | 社区阅读：公开内容发现、帖子阅读与讨论流 | 建议新增，未实施 |
| `/c/:slug/posts/new` | 发布帖子 | [views/PostFormView.vue](../../../frontend/apps/community/src/views/PostFormView.vue) | 专注编辑 | 发布/编辑单篇帖子；仍需保留社区原壳层 | 拟归属，未实施 |
| `/c/:slug/posts/:postId(\d+)` | 帖子详情 | [views/PostView.vue](../../../frontend/apps/community/src/views/PostView.vue) | 待新增类 | 社区阅读：公开内容发现、帖子阅读与讨论流 | 建议新增，未实施 |
| `/c/:slug/posts/:postId(\d+)/edit` | 编辑帖子 | [views/PostFormView.vue](../../../frontend/apps/community/src/views/PostFormView.vue) | 专注编辑 | 发布/编辑单篇帖子；仍需保留社区原壳层 | 拟归属，未实施 |
| `/c/:slug/manage/:section(boards&#124;announcements&#124;posts&#124;comments&#124;members)/:itemId?` | 社区管理 | [views/ManageView.vue](../../../frontend/apps/community/src/views/ManageView.vue) | 分类工作区 | 按板块、公告、帖子、评论、成员等稳定治理范围切换 | 拟归属，未实施 |

## display — {team}.display.lostsky.work（5 页）

路由来源：frontend/apps/display/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/` | 团队公开主页 | [views/HomeView.vue](../../../frontend/apps/display/src/views/HomeView.vue) | 待新增类 | 公开展示：品牌/人物内容陈列，不使用后台外壳 | 建议新增，未实施 |
| `/entities` | 公开人员 | [views/EntitiesView.vue](../../../frontend/apps/display/src/views/EntitiesView.vue) | 待新增类 | 公开展示：品牌/人物内容陈列，不使用后台外壳 | 建议新增，未实施 |
| `/entity/:slug` | 人员资料 | [views/EntityView.vue](../../../frontend/apps/display/src/views/EntityView.vue) | 待新增类 | 公开展示：品牌/人物内容陈列，不使用后台外壳 | 建议新增，未实施 |
| `/document/:id(\d+)` | 公开文档 | [views/DocumentView.vue](../../../frontend/apps/display/src/views/DocumentView.vue) | 待新增类 | 内容阅读：长文档阅读与正文导航 | 建议新增，未实施 |
| `/:pathMatch(.*)*` | 页面不存在 | [views/NotFoundView.vue](../../../frontend/apps/display/src/views/NotFoundView.vue) | 待新增类 | 系统结果：未找到页面与返回入口 | 建议新增，未实施 |

## shop — {team}.shop.lostsky.work（24 页）

路由来源：frontend/apps/shop/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/` | 商城 | [views/HomeView.vue](../../../frontend/apps/shop/src/views/HomeView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/product/:id(\d+)` | 商品详情 | [views/ProductView.vue](../../../frontend/apps/shop/src/views/ProductView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/product/:id(\d+)/checkout` | 确认购买 | [views/CheckoutView.vue](../../../frontend/apps/shop/src/views/CheckoutView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/customer/bind` | 领取顾客身份 | [views/CustomerBindView.vue](../../../frontend/apps/shop/src/views/CustomerBindView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/customer/profile` | 我的资料 | [views/CustomerProfileView.vue](../../../frontend/apps/shop/src/views/CustomerProfileView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/orders` | 我的订单 | [views/OrdersView.vue](../../../frontend/apps/shop/src/views/OrdersView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/orders/:id(\d+)` | 订单详情 | [views/OrderView.vue](../../../frontend/apps/shop/src/views/OrderView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/services` | 我的服务 | [views/ServicesView.vue](../../../frontend/apps/shop/src/views/ServicesView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/services/:id(\d+)` | 服务核销 | [views/ServiceView.vue](../../../frontend/apps/shop/src/views/ServiceView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/cards` | 我的卡密 | [views/CardsView.vue](../../../frontend/apps/shop/src/views/CardsView.vue) | 待新增类 | 购物与顾客自助：公开陈列、购买确认及顾客履约生命周期 | 建议新增，未实施 |
| `/manage` | 概览 | [views/manage/ManageOverviewView.vue](../../../frontend/apps/shop/src/views/manage/ManageOverviewView.vue) | 总览分析 | 团队/个人经营工作入口与当前范围 | 已实施，待批阅 |
| `/manage/personal` | 概览 | [views/manage/PersonalOverviewView.vue](../../../frontend/apps/shop/src/views/manage/PersonalOverviewView.vue) | 总览分析 | 团队/个人经营工作入口与当前范围 | 已实施，待批阅 |
| `/manage/personal/products` | 我的商品 | [views/manage/ProductsView.vue](../../../frontend/apps/shop/src/views/manage/ProductsView.vue) | 对象目录 | 定位商品或订单，再进入独立任务 | 已有模板（基线） |
| `/manage/personal/products/new` | 新建本人商品 | [views/manage/ProductFormView.vue](../../../frontend/apps/shop/src/views/manage/ProductFormView.vue) | 专注编辑 | 填写一个商品或订单并提交 | 拟归属，未实施 |
| `/manage/personal/products/:id(\d+)` | 编辑本人商品 | [views/manage/ProductFormView.vue](../../../frontend/apps/shop/src/views/manage/ProductFormView.vue) | 专注编辑 | 填写一个商品或订单并提交 | 拟归属，未实施 |
| `/manage/personal/orders` | 我的业务订单 | [views/manage/PersonalOrdersView.vue](../../../frontend/apps/shop/src/views/manage/PersonalOrdersView.vue) | 对象目录 | 定位商品或订单，再进入独立任务 | 拟归属，未实施 |
| `/manage/products` | 商品 | [views/manage/ProductsView.vue](../../../frontend/apps/shop/src/views/manage/ProductsView.vue) | 对象目录 | 定位商品或订单，再进入独立任务 | 已有模板（基线） |
| `/manage/products/new` | 新建商品 | [views/manage/ProductFormView.vue](../../../frontend/apps/shop/src/views/manage/ProductFormView.vue) | 专注编辑 | 填写一个商品或订单并提交 | 拟归属，未实施 |
| `/manage/products/:id(\d+)` | 编辑商品 | [views/manage/ProductFormView.vue](../../../frontend/apps/shop/src/views/manage/ProductFormView.vue) | 专注编辑 | 填写一个商品或订单并提交 | 拟归属，未实施 |
| `/manage/orders` | 订单 | [views/manage/OrdersView.vue](../../../frontend/apps/shop/src/views/manage/OrdersView.vue) | 对象目录 | 定位商品或订单，再进入独立任务 | 拟归属，未实施 |
| `/manage/orders/new` | 新建订单 | [views/manage/OrderFormView.vue](../../../frontend/apps/shop/src/views/manage/OrderFormView.vue) | 专注编辑 | 填写一个商品或订单并提交 | 拟归属，未实施 |
| `/manage/orders/:id(\d+)` | 订单详情 | [views/manage/OrderDetailView.vue](../../../frontend/apps/shop/src/views/manage/OrderDetailView.vue) | 对象档案 | 查看单个订单的状态、明细及后续动作 | 拟归属，未实施 |
| `/manage/:pathMatch(.*)*` | 404 | [views/NotFoundView.vue](../../../frontend/apps/shop/src/views/NotFoundView.vue) | 待新增类 | 系统结果：未找到页面与返回入口 | 建议新增，未实施 |
| `/:pathMatch(.*)*` | 页面不存在 | [views/NotFoundView.vue](../../../frontend/apps/shop/src/views/NotFoundView.vue) | 待新增类 | 系统结果：未找到页面与返回入口 | 建议新增，未实施 |

## team — {team}.team.lostsky.work（57 页）

路由来源：frontend/apps/team/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/communities` | 团队社区 | [views/CommunitiesView.vue](../../../frontend/apps/team/src/views/CommunitiesView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/communities/new` | 创建社区 | [views/CommunitiesView.vue](../../../frontend/apps/team/src/views/CommunitiesView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/communities/:id(\d+)` | 社区详情 | [views/CommunitiesView.vue](../../../frontend/apps/team/src/views/CommunitiesView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/communities/:id(\d+)/edit` | 编辑社区 | [views/CommunitiesView.vue](../../../frontend/apps/team/src/views/CommunitiesView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/communities/:id(\d+)/administrators` | 社区管理员 | [views/CommunitiesView.vue](../../../frontend/apps/team/src/views/CommunitiesView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/` | 概览 | [views/DashboardView.vue](../../../frontend/apps/team/src/views/DashboardView.vue) | 总览分析 | 团队/个人当前范围与主要工作入口 | 已实施，待批阅 |
| `/personal/notices` | 收件箱 | [views/NoticesView.vue](../../../frontend/apps/team/src/views/NoticesView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 拟归属，未实施 |
| `/personal/notices/detail` | 阅读通知 | [views/NoticeDetailView.vue](../../../frontend/apps/team/src/views/NoticeDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/notices/sent` | 通知中心 | [views/NoticesView.vue](../../../frontend/apps/team/src/views/NoticesView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 已有模板（基线） |
| `/notices/sent/detail` | 通知查看情况 | [views/NoticeDetailView.vue](../../../frontend/apps/team/src/views/NoticeDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/notices/team` | 通知中心 | [views/NoticesView.vue](../../../frontend/apps/team/src/views/NoticesView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 已有模板（基线） |
| `/notices/team/detail` | 阅读站内通知 | [views/NoticeDetailView.vue](../../../frontend/apps/team/src/views/NoticeDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/notices/send` | 发送通知 | [views/NoticeSendView.vue](../../../frontend/apps/team/src/views/NoticeSendView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/files` | 文件 | [views/FilesView.vue](../../../frontend/apps/team/src/views/FilesView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/settings` | 团队设置 | [views/SettingsView.vue](../../../frontend/apps/team/src/views/SettingsView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 已有模板（基线） |
| `/abilities` | 团队能力 | [views/AbilitiesView.vue](../../../frontend/apps/team/src/views/AbilitiesView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/audit` | 审计日志 | [views/AuditView.vue](../../../frontend/apps/team/src/views/AuditView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 已有模板（基线） |
| `/audit/:id(\d+)` | 审计事件 | [views/AuditDetailView.vue](../../../frontend/apps/team/src/views/AuditDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/chat-groups` | 聊天管理 | [views/ChatGroupsView.vue](../../../frontend/apps/team/src/views/ChatGroupsView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/chat-groups/new` | 创建群聊 | [views/ChatGroupView.vue](../../../frontend/apps/team/src/views/ChatGroupView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/chat-groups/:uuid` | 管理群聊 | [views/ChatGroupView.vue](../../../frontend/apps/team/src/views/ChatGroupView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/chat-virtuals` | 虚拟人员 | [views/ChatVirtualsView.vue](../../../frontend/apps/team/src/views/ChatVirtualsView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/chat-virtual-new` | 创建虚拟人员 | [views/ChatVirtualFormView.vue](../../../frontend/apps/team/src/views/ChatVirtualFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/chat-virtual` | 编辑虚拟人员 | [views/ChatVirtualFormView.vue](../../../frontend/apps/team/src/views/ChatVirtualFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/chat-integration-new` | 创建 Webhook 集成 | [views/ChatIntegrationFormView.vue](../../../frontend/apps/team/src/views/ChatIntegrationFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/chat-integration` | 编辑 Webhook 集成 | [views/ChatIntegrationFormView.vue](../../../frontend/apps/team/src/views/ChatIntegrationFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/fields` | 对象字段 | [views/EntityFieldsView.vue](../../../frontend/apps/team/src/views/EntityFieldsView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/entities` | 人员 | [views/EntitiesView.vue](../../../frontend/apps/team/src/views/EntitiesView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/entity` | 人员资料 | [views/EntityDetailView.vue](../../../frontend/apps/team/src/views/EntityDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/field-new` | 创建对象字段 | [views/EntityFieldFormView.vue](../../../frontend/apps/team/src/views/EntityFieldFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/field-edit` | 编辑对象字段 | [views/EntityFieldFormView.vue](../../../frontend/apps/team/src/views/EntityFieldFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/roles/new` | 新建角色 | [views/RoleFormView.vue](../../../frontend/apps/team/src/views/RoleFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/roles/entities` | 人员角色分配 | [views/EntityRolesView.vue](../../../frontend/apps/team/src/views/EntityRolesView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/roles/:id(\d+)` | 编辑角色权限 | [views/RoleDetailView.vue](../../../frontend/apps/team/src/views/RoleDetailView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/roles` | 角色权限 | [views/RolesView.vue](../../../frontend/apps/team/src/views/RolesView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/join-fields/new` | 创建申请字段 | [views/JoinFieldFormView.vue](../../../frontend/apps/team/src/views/JoinFieldFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/join-fields/:id(\d+)` | 申请字段 | [views/JoinFieldFormView.vue](../../../frontend/apps/team/src/views/JoinFieldFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/join-fields` | 申请字段 | [views/JoinFieldsView.vue](../../../frontend/apps/team/src/views/JoinFieldsView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 拟归属，未实施 |
| `/join-review/review` | 审核加入申请 | [views/JoinReviewDetailView.vue](../../../frontend/apps/team/src/views/JoinReviewDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/join-review` | 人事审核 | [views/JoinReviewView.vue](../../../frontend/apps/team/src/views/JoinReviewView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 拟归属，未实施 |
| `/departure-review/review` | 审核离队申请 | [views/MemberDepartureDetailView.vue](../../../frontend/apps/team/src/views/MemberDepartureDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/departure-review` | 人事审核 | [views/MemberDepartureView.vue](../../../frontend/apps/team/src/views/MemberDepartureView.vue) | 分类工作区 | 按稳定的设置、通知、审计或审核范围切换 | 拟归属，未实施 |
| `/members` | 成员 | [views/MembersView.vue](../../../frontend/apps/team/src/views/MembersView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 已有模板（基线） |
| `/customers` | 顾客 | [views/CustomersView.vue](../../../frontend/apps/team/src/views/CustomersView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 已有模板（基线） |
| `/customers/:id(\d+)` | 顾客详情 | [views/CustomerDetailView.vue](../../../frontend/apps/team/src/views/CustomerDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/member-add` | 添加成员 | [views/MemberFormView.vue](../../../frontend/apps/team/src/views/MemberFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/member-edit` | 编辑成员 | [views/MemberFormView.vue](../../../frontend/apps/team/src/views/MemberFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/docs` | 文档 | [views/DocumentsView.vue](../../../frontend/apps/team/src/views/DocumentsView.vue) | 对象目录 | 定位人员、文件、字段或其他管理对象 | 已有模板（基线） |
| `/doc-create` | 新建文档 | [views/DocumentFormView.vue](../../../frontend/apps/team/src/views/DocumentFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/doc-edit` | 编辑文档 | [views/DocumentFormView.vue](../../../frontend/apps/team/src/views/DocumentFormView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/member-detail` | 成员详情 | [views/MemberDetailView.vue](../../../frontend/apps/team/src/views/MemberDetailView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/doc` | 文档 | [views/DocumentView.vue](../../../frontend/apps/team/src/views/DocumentView.vue) | 待新增类 | 内容阅读：以文档正文及阅读导航为主体 | 建议新增，未实施 |
| `/personal` | 概览 | [views/PersonalView.vue](../../../frontend/apps/team/src/views/PersonalView.vue) | 总览分析 | 团队/个人当前范围与主要工作入口 | 已实施，待批阅 |
| `/personal/profile` | 资料 | [views/PersonalView.vue](../../../frontend/apps/team/src/views/PersonalView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/personal/fields` | 对象字段 | [views/PersonalView.vue](../../../frontend/apps/team/src/views/PersonalView.vue) | 专注编辑 | 围绕单个填写、配置、授权或发送任务提交 | 拟归属，未实施 |
| `/personal/access` | 角色与权限 | [views/PersonalView.vue](../../../frontend/apps/team/src/views/PersonalView.vue) | 对象档案 | 围绕单个对象查看资料、状态、关系与上下文动作 | 拟归属，未实施 |
| `/join` | 申请加入 | [views/JoinView.vue](../../../frontend/apps/team/src/views/JoinView.vue) | 待新增类 | 身份流程：外部加入申请与身份衔接 | 建议新增，未实施 |

## transaction — {team}.transaction.lostsky.work（22 页）

路由来源：frontend/apps/transaction/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/overview` | 概览 | [views/TeamOverviewView.vue](../../../frontend/apps/transaction/src/views/TeamOverviewView.vue) | 总览分析 | 当前工作范围、主要业务入口或真实经营统计 | 已实施，待批阅 |
| `/transactions` | 团队流水 | [views/TransactionsView.vue](../../../frontend/apps/transaction/src/views/TransactionsView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/personal` | 概览 | [views/PersonalOverviewView.vue](../../../frontend/apps/transaction/src/views/PersonalOverviewView.vue) | 总览分析 | 当前工作范围、主要业务入口或真实经营统计 | 已实施，待批阅 |
| `/personal/transactions` | 我的流水 | [views/PersonalWorkspaceView.vue](../../../frontend/apps/transaction/src/views/PersonalWorkspaceView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/personal/transactions/new` | 登记流水 | [views/TransactionFormView.vue](../../../frontend/apps/transaction/src/views/TransactionFormView.vue) | 专注编辑 | 登记、赋予权益或充值的单次提交任务 | 拟归属，未实施 |
| `/personal/transactions/:id(\d+)` | 流水详情 | [views/TransactionDetailView.vue](../../../frontend/apps/transaction/src/views/TransactionDetailView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/personal/services` | 我的接单 | [views/PersonalWorkspaceView.vue](../../../frontend/apps/transaction/src/views/PersonalWorkspaceView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/personal/service-offers/:id(\d+)` | 接单邀请 | [views/PersonalServiceTaskView.vue](../../../frontend/apps/transaction/src/views/PersonalServiceTaskView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/personal/services/available/:id(\d+)` | 公开任务 | [views/PersonalServiceTaskView.vue](../../../frontend/apps/transaction/src/views/PersonalServiceTaskView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/personal/services/:id(\d+)` | 我的接单任务 | [views/PersonalServiceTaskView.vue](../../../frontend/apps/transaction/src/views/PersonalServiceTaskView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/personal/customers` | 我的顾客 | [views/PersonalCustomersView.vue](../../../frontend/apps/transaction/src/views/PersonalCustomersView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/personal/entitlements` | 权益下发 | [views/PersonalEntitlementsView.vue](../../../frontend/apps/transaction/src/views/PersonalEntitlementsView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/personal/entitlements/new` | 下发顾客权益 | [views/EntitlementGrantView.vue](../../../frontend/apps/transaction/src/views/EntitlementGrantView.vue) | 专注编辑 | 登记、赋予权益或充值的单次提交任务 | 拟归属，未实施 |
| `/detail` | 流水详情 | [views/TransactionDetailView.vue](../../../frontend/apps/transaction/src/views/TransactionDetailView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/edit` | 编辑流水 | [views/TransactionFormView.vue](../../../frontend/apps/transaction/src/views/TransactionFormView.vue) | 专注编辑 | 登记、赋予权益或充值的单次提交任务 | 拟归属，未实施 |
| `/stats` | 经营统计 | [views/StatsView.vue](../../../frontend/apps/transaction/src/views/StatsView.vue) | 总览分析 | 当前工作范围、主要业务入口或真实经营统计 | 已实施，待批阅 |
| `/services` | 权益核销 | [views/ServicesView.vue](../../../frontend/apps/transaction/src/views/ServicesView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/entitlements/new` | 赋予顾客权益 | [views/EntitlementGrantView.vue](../../../frontend/apps/transaction/src/views/EntitlementGrantView.vue) | 专注编辑 | 登记、赋予权益或充值的单次提交任务 | 拟归属，未实施 |
| `/services/:id(\d+)` | 核销详情 | [views/ServiceDetailView.vue](../../../frontend/apps/transaction/src/views/ServiceDetailView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/balances` | 顾客余额 | [views/BalancesView.vue](../../../frontend/apps/transaction/src/views/BalancesView.vue) | 对象目录 | 找到流水、任务、顾客、权益或余额对象；局部汇总不改变主任务 | 拟归属，未实施 |
| `/balance` | 余额明细 | [views/BalanceLogsView.vue](../../../frontend/apps/transaction/src/views/BalanceLogsView.vue) | 对象档案 | 单笔流水、任务或顾客余额的上下文详情与动作 | 拟归属，未实施 |
| `/recharge` | 顾客充值 | [views/RechargeView.vue](../../../frontend/apps/transaction/src/views/RechargeView.vue) | 专注编辑 | 登记、赋予权益或充值的单次提交任务 | 拟归属，未实施 |

## weibo — {team}.weibo.lostsky.work（25 页）

路由来源：frontend/apps/weibo/src/router.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/overview` | 概览 | [views/OverviewView.vue](../../../frontend/apps/weibo/src/views/OverviewView.vue) | 总览分析 | 工作范围与微博业务入口 | 已实施，待批阅 |
| `/interactions/comment-presets` | 预设评论 | [views/CommentPresetsView.vue](../../../frontend/apps/weibo/src/views/CommentPresetsView.vue) | 对象目录 | 定位账号、持续任务或预设评论 | 拟归属，未实施 |
| `/interactions/comment-presets/new` | 添加预设 | [views/CommentPresetFormView.vue](../../../frontend/apps/weibo/src/views/CommentPresetFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/interactions/comment-presets/edit` | 编辑预设 | [views/CommentPresetFormView.vue](../../../frontend/apps/weibo/src/views/CommentPresetFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/accounts` | 账号 | [views/AccountsView.vue](../../../frontend/apps/weibo/src/views/AccountsView.vue) | 对象目录 | 定位账号、持续任务或预设评论 | 拟归属，未实施 |
| `/accounts/bind` | 绑定账号 | [views/AccountBindingView.vue](../../../frontend/apps/weibo/src/views/AccountBindingView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/compose` | 超话发帖 | [views/OperationView.vue](../../../frontend/apps/weibo/src/views/OperationView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/interactions` | 互动 | [views/InteractionView.vue](../../../frontend/apps/weibo/src/views/InteractionView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/tasks` | 持续任务 | [views/TasksView.vue](../../../frontend/apps/weibo/src/views/TasksView.vue) | 对象目录 | 定位账号、持续任务或预设评论 | 拟归属，未实施 |
| `/tasks/new` | 新建任务 | [views/TaskFormView.vue](../../../frontend/apps/weibo/src/views/TaskFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/tasks/:id(\d+)` | 编辑任务 | [views/TaskFormView.vue](../../../frontend/apps/weibo/src/views/TaskFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/logs` | 执行日志 | [views/LogsView.vue](../../../frontend/apps/weibo/src/views/LogsView.vue) | 分类工作区 | 按执行记录及其状态核查自动化结果 | 拟归属，未实施 |
| `/personal` | 概览 | [views/OverviewView.vue](../../../frontend/apps/weibo/src/views/OverviewView.vue) | 总览分析 | 工作范围与微博业务入口 | 已实施，待批阅 |
| `/personal/feed` | 点单信息流 | [views/FeedView.vue](../../../frontend/apps/weibo/src/views/FeedView.vue) | 待新增类 | 信息流处置：阅读点单内容并按上下文发起操作 | 建议新增，未实施 |
| `/personal/interactions/comment-presets` | 预设评论 | [views/CommentPresetsView.vue](../../../frontend/apps/weibo/src/views/CommentPresetsView.vue) | 对象目录 | 定位账号、持续任务或预设评论 | 拟归属，未实施 |
| `/personal/interactions/comment-presets/new` | 添加预设 | [views/CommentPresetFormView.vue](../../../frontend/apps/weibo/src/views/CommentPresetFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/interactions/comment-presets/edit` | 编辑预设 | [views/CommentPresetFormView.vue](../../../frontend/apps/weibo/src/views/CommentPresetFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/accounts` | 账号 | [views/AccountsView.vue](../../../frontend/apps/weibo/src/views/AccountsView.vue) | 对象目录 | 定位账号、持续任务或预设评论 | 拟归属，未实施 |
| `/personal/accounts/bind` | 绑定账号 | [views/AccountBindingView.vue](../../../frontend/apps/weibo/src/views/AccountBindingView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/compose` | 超话发帖 | [views/OperationView.vue](../../../frontend/apps/weibo/src/views/OperationView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/interactions` | 互动 | [views/InteractionView.vue](../../../frontend/apps/weibo/src/views/InteractionView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/tasks` | 持续任务 | [views/TasksView.vue](../../../frontend/apps/weibo/src/views/TasksView.vue) | 对象目录 | 定位账号、持续任务或预设评论 | 拟归属，未实施 |
| `/personal/tasks/new` | 新建任务 | [views/TaskFormView.vue](../../../frontend/apps/weibo/src/views/TaskFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/tasks/:id(\d+)` | 编辑任务 | [views/TaskFormView.vue](../../../frontend/apps/weibo/src/views/TaskFormView.vue) | 专注编辑 | 一次绑定、发帖、互动、预设或任务配置 | 拟归属，未实施 |
| `/personal/logs` | 执行日志 | [views/LogsView.vue](../../../frontend/apps/weibo/src/views/LogsView.vue) | 分类工作区 | 按执行记录及其状态核查自动化结果 | 拟归属，未实施 |

## site — www.lostsky.work（1 页）

路由来源：frontend/apps/site/src/main.ts。

| 实际路由 | 页面 | 源码 | 归属 | 理由 | 实施状态 |
| --- | --- | --- | --- | --- | --- |
| `/` | LostSky 官网 | [App.vue](../../../frontend/apps/site/src/App.vue) | 待新增类 | 公开营销：品牌长页叙事与访问转化 | 建议新增，未实施 |

## 重定向、兼容入口与参数映射

| 应用 | 入口 | 目标与保留语义 |
| --- | --- | --- |
| account | `/` | /login |
| admin | `/:pathMatch(.*)*` | / |
| chat | `/profile` | Account /identity（identityUrl），携带当前地址作为回跳；beforeEnter 返回 false，不呈现另一份 ChatView |
| community | `/:pathMatch(.*)*` | / |
| team | `/notice` | /personal/notices 或 /notices/team；团队身份走 team，其余走 personal，保留 query/hash |
| team | `/notice-detail` | /personal/notices/detail 或 /notices/team/detail；团队身份走 team，其余走 personal，保留 query/hash |
| team | `/notice-send` | /notices/send，保留 query/hash |
| team | `/me` | /personal/profile |
| transaction | `/` | /overview |
| transaction | `/personal/bindings` | /personal/customers |
| weibo | `/` | /overview |

没有显式 alias 字段；兼容路径以上述 redirect 为准。Account /identity/current/:section? 有可见的加载、失败及重试界面，已计入身份流程：依据 /identity/target 回到 Team /personal/profile、Shop /customer/profile 或 Account /identity；section 当前不改变目标。

参数映射：:id、:userId、:postId 的数字约束按路由保留；:uuid 为群聊对象，:slug 为社区或公开人员，:section 为治理范围。社区管理 section 覆盖 boards / announcements / posts / comments / members，:itemId? 覆盖所选对象的上下文子状态；不按每个参数值或 tab 重复计页。没有 path 参数但由 query 定位对象的 /member-detail、/member-edit、/entity、/doc、/doc-edit、/notices/*/detail、Transaction /detail、/edit、/balance 等仍各计一页，原 query 由原页面继续处理。

## 五类之外的页面与新增模板建议

下表逐项引用上文路由；同类页面可以共享信息组织，但不要求共用跨前后台外壳。

| 新增建议 | 页面 | 不能强套五类的原因 |
| --- | --- | --- |
| 身份流程 | account `/login` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 身份流程 | account `/recovery` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 身份流程 | account `/register` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 身份流程 | account `/identity` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 身份流程 | account `/identity/member-callback` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 身份流程 | account `/identity/workspace-warning` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 身份流程 | account `/identity/current/:section?` | 登录、恢复、注册或选择/领取身份，存在跨应用回跳 |
| 系统结果 | admin `/forbidden` | 访问受限说明与恢复路径 |
| 会话协作 | chat `/` | 会话列表、消息流或会话建立/邀请治理，不是静态对象管理 |
| 会话协作 | chat `/requests` | 会话列表、消息流或会话建立/邀请治理，不是静态对象管理 |
| 会话协作 | chat `/new` | 会话列表、消息流或会话建立/邀请治理，不是静态对象管理 |
| 社区阅读 | community `/` | 公开内容发现、帖子阅读与讨论流 |
| 社区阅读 | community `/mine` | 公开内容发现、帖子阅读与讨论流 |
| 社区阅读 | community `/c/:slug` | 公开内容发现、帖子阅读与讨论流 |
| 社区阅读 | community `/c/:slug/posts/:postId(\d+)` | 公开内容发现、帖子阅读与讨论流 |
| 公开展示 | display `/` | 品牌/人物内容陈列，不使用后台外壳 |
| 公开展示 | display `/entities` | 品牌/人物内容陈列，不使用后台外壳 |
| 公开展示 | display `/entity/:slug` | 品牌/人物内容陈列，不使用后台外壳 |
| 内容阅读 | display `/document/:id(\d+)` | 长文档阅读与正文导航 |
| 系统结果 | display `/:pathMatch(.*)*` | 未找到页面与返回入口 |
| 购物与顾客自助 | shop `/` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/product/:id(\d+)` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/product/:id(\d+)/checkout` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/customer/bind` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/customer/profile` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/orders` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/orders/:id(\d+)` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/services` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/services/:id(\d+)` | 公开陈列、购买确认及顾客履约生命周期 |
| 购物与顾客自助 | shop `/cards` | 公开陈列、购买确认及顾客履约生命周期 |
| 系统结果 | shop `/manage/:pathMatch(.*)*` | 未找到页面与返回入口 |
| 系统结果 | shop `/:pathMatch(.*)*` | 未找到页面与返回入口 |
| 内容阅读 | team `/doc` | 以文档正文及阅读导航为主体 |
| 身份流程 | team `/join` | 外部加入申请与身份衔接 |
| 信息流处置 | weibo `/personal/feed` | 阅读点单内容并按上下文发起操作 |
| 公开营销 | site `/` | 品牌长页叙事与访问转化 |

## 非页面排除与完整性边界

- App.vue（Site 除外）、各 Shell/Layout、公共组件、业务子组件、弹窗、字段编辑器、图表、组件预览 Story 与 catalog 记录不作为业务路由计数。component-previews 是开发预览宿主，不是用户应用。
- Team ResourceView 的资源定义经路由过滤后没有新增存量入口；不因 views/ 目录存在 Vue 文件就计一页。没有被当前 router/main 引用的历史页面文件不计数。
- 文档站由独立 MkDocs 配置发布，不在 frontend/apps 的应用路由集合内；本清单不宣称覆盖其文章 URL、后端 API、静态资源或未知服务器 rewrite。
- /:pathMatch(.*)* 的结果页计一次；跳转式 catch-all 不计。公开域的团队 slug 与 runtime 身份重定向改变数据范围，不生成新的页面模式。
- 本表读取全部 9 份 router.ts 与 Site main.ts，并展开路由工厂；只对分类不明确的少数页面读取入口，没有全量审查业务实现。拟归属是设计建议，不是授权、功能、响应式或可用性验收。
- 待批阅后再由各页面负责人评估迁移；本次未更改路由、后端、权限、公共主题、公共 demo 或其他模板实例；总览实施详见配套说明。
