# 公开、阅读与消费页面模板任务清单

更新：2026-10-18。关联本聊天活动目标；目标工具不支持修改正文，本文件维护逐路由进度。基线 main `3397e3ae`，工作区 `C:/lostsky-worktrees/public-reading-commerce-templates`，分支 `codex/public-reading-commerce-templates`。

## 当前未完成页面与交付状态

本聊天分配的 **23 个实际路由模式**已完成代码层面的版型处理；治理可选参数展开后，下表为 **34 个路由/分支记录**。保留项逐项列出当前源码结构证据，没有把现有专用版型重复改造成后台模板。所有“已完成”仅指实施完成、等待批阅，**不表示测试或验收通过**。

仍未完成的外部归属页面：Community `/c/:slug/posts/new`、`/c/:slug/posts/:postId(\d+)/edit`。两者由第四 / 专注编辑对话负责，本聊天未开始修改，外部完成状态未核实。本聊天页面实施无剩余项，已建立本地提交，预览附件路径见下。

本人实施，不使用子代理；按授权不运行测试、验收、typecheck 或完整构建，不合 main、推送、部署、更新公共 demo 或删除环境。

## 模板界定

- 公开发现：品牌、人员或商品为主体，筛选紧贴结果；保留公共主题，不添加后台侧栏。
- 内容阅读：正文居中约 65–75ch，标题/作者/来源为阅读头，互动随正文，无需对象详情外壳。
- 消费流程：购买内容 → 资料 → 确认；记录页突出状态与金额，权益页突出额度与实际操作。
- 个人信息流：按时间连续阅读，文章动作与评论位于文章内，保留无限加载与草稿。
- 社区治理：分区与内容相邻；列表 64rem、板块/公告编辑 46rem，复用原治理能力。
- 品牌长页：保留深色、青紫与原有媒体，按成员、业务、优势、行动形成叙述。

## 逐路由实施证据

源码为 `frontend/apps/<应用小写>/src/views/<文件>`；Site 为 `frontend/apps/site/src/App.vue`。保留项证据来自当前基线源码，而非公共组件引用或旧覆盖清单。

| 应用 | 实际路由 / 分支 | 源码 | 模板 | 状态 | 版型证据 |
| --- | --- | --- | --- | --- | --- |
| Display | `/` | HomeView.vue | 公开展示 | 已完成（待批阅） | 保留 team-hero → 介绍/公开字段 → 文档分组 → 人员预览，媒体和加载/重试分支独立。 |
| Display | `/entities` | EntitiesView.vue | 公开目录 | 已完成（待批阅） | 保留页头 → 搜索/类型 → 结果数量 → 连续人员列表 → 分页，未套后台侧栏。 |
| Display | `/entity/:slug` | EntityView.vue | 人物展示 | 已完成（待批阅） | 保留 intro_image 主视觉及资料/媒体/商品/文档连续分区，无聊天或加入动作。 |
| Display | `/document/:id(\d+)` | DocumentView.vue | 内容阅读 | 已完成（待批阅） | 本轮标题与正文统一为 75ch 阅读栏，保留来源/更新时间/返回和不可读分支。 |
| Display | `/:pathMatch(.*)*` | NotFoundView.vue | 公开结果 | 已完成（待批阅） | 保留单列 404 说明与返回团队主页，无后台动作。 |
| Shop | `/` | HomeView.vue | 商品发现 | 已完成（待批阅） | 本轮品牌头后直接呈现商品，商店介绍移到陈列之后；真实商品与空态保留。 |
| Shop | `/product/:id(\d+)` | ProductView.vue | 购买决策 | 已完成（待批阅） | 保留商品图与规格/价格/购买入口并列；商品内容、规格说明和详情随后；kind=5 规格分支保留。 |
| Shop | `/product/:id(\d+)/checkout` | CheckoutView.vue | 消费确认 | 已完成（待批阅） | 本轮商品摘要 → 购买资料/数量/接单人/备注 → 付款确认单列；规格/上传/余额/草稿不变。 |
| Shop | `/customer/bind` | CustomerBindView.vue | 身份关联 | 已完成（待批阅） | 保留本店关联说明与可选标识表单；只读邀请人和单一建立账户动作。 |
| Shop | `/customer/profile` | CustomerProfileView.vue | 顾客资料 | 已完成（待批阅） | 保留身份/标识/归属连续章节与统一保存；loading/blocked/mismatch/error 分支独立。 |
| Shop | `/orders` | OrdersView.vue | 消费记录 | 已完成（待批阅） | 保留订单标题与余额摘要、按时间连续订单行；空态浏览商城、加载/错误分支保留。 |
| Shop | `/orders/:id(\d+)` | OrderView.vue | 消费凭据 | 已完成（待批阅） | 本轮状态之后优先呈现缩略图与总额，再呈现下单/支付/资料明细；退款确认保留。 |
| Shop | `/services` | ServicesView.vue | 权益目录 | 已完成（待批阅） | 保留服务名称、可用/授予额度和到期日连续行，状态与分页独立。 |
| Shop | `/services/:id(\d+)` | ServiceView.vue | 权益使用 | 已完成（待批阅） | 保留状态 → 额度/发起履约 → 邀请 → 履约记录；过期/耗尽、费用/结单/取消分支不变。 |
| Shop | `/cards` | CardsView.vue | 兑换与记录 | 已完成（待批阅） | 本轮兑换与已持有卡密各自分组；共享错误在两组之外，查看/复制逻辑保留。 |
| Community | `/` | CommunitiesView.vue | 社区发现 | 已完成（待批阅） | 本轮页头/筛选分组；头像、名称、归属、简介、进入动作组成连续目录行。 |
| Community | `/mine` | CommunitiesView.vue | 加入的社区 | 已完成（待批阅） | 本轮同一目录版型；mine 查询、未登录/未选身份和空态发现出口分别保留。 |
| Community | `/c/:slug` | CommunityView.vue | 社区讨论 | 已完成（待批阅） | 本轮介绍/加入状态为头区，公告独立，板块/搜索/帖子/分页归入讨论区。 |
| Community | `/c/:slug/posts/:postId(\d+)` | PostView.vue | 帖子阅读 | 已完成（待批阅） | 本轮 75ch 正文改 article，作者/内容/互动连续；评论编辑、删除/隐藏提示保留。 |
| Community | `/c/:slug/manage/boards` | ManageView.vue | 社区治理 | 已完成（待批阅） | 本轮 64rem 浏览宿主；分区/筛选/状态/列表/处理原因与权限沿用原治理能力。 |
| Community | `/c/:slug/manage/boards/new` | ManageView.vue | 治理编辑 | 已完成（待批阅） | 本轮 46rem 聚焦编辑宿主；原字段组、单一保存/取消、详情/草稿/错误处理保留。 |
| Community | `/c/:slug/manage/boards/:itemId` | ManageView.vue | 治理编辑 | 已完成（待批阅） | 本轮 46rem 聚焦编辑宿主；原字段组、单一保存/取消、详情/草稿/错误处理保留。 |
| Community | `/c/:slug/manage/announcements` | ManageView.vue | 社区治理 | 已完成（待批阅） | 本轮 64rem 浏览宿主；分区/筛选/状态/列表/处理原因与权限沿用原治理能力。 |
| Community | `/c/:slug/manage/announcements/new` | ManageView.vue | 治理编辑 | 已完成（待批阅） | 本轮 46rem 聚焦编辑宿主；原字段组、单一保存/取消、详情/草稿/错误处理保留。 |
| Community | `/c/:slug/manage/announcements/:itemId` | ManageView.vue | 治理编辑 | 已完成（待批阅） | 本轮 46rem 聚焦编辑宿主；原字段组、单一保存/取消、详情/草稿/错误处理保留。 |
| Community | `/c/:slug/manage/posts` | ManageView.vue | 社区治理 | 已完成（待批阅） | 本轮 64rem 浏览宿主；分区/筛选/状态/列表/处理原因与权限沿用原治理能力。 |
| Community | `/c/:slug/manage/posts/:itemId` | ManageView.vue | 社区治理 | 已完成（待批阅） | 按原语义此 section 的 itemId 不触发编辑，继续列表/治理操作，使用相同浏览宿主。 |
| Community | `/c/:slug/manage/comments` | ManageView.vue | 社区治理 | 已完成（待批阅） | 本轮 64rem 浏览宿主；分区/筛选/状态/列表/处理原因与权限沿用原治理能力。 |
| Community | `/c/:slug/manage/comments/:itemId` | ManageView.vue | 社区治理 | 已完成（待批阅） | 按原语义此 section 的 itemId 不触发编辑，继续列表/治理操作，使用相同浏览宿主。 |
| Community | `/c/:slug/manage/members` | ManageView.vue | 社区治理 | 已完成（待批阅） | 本轮 64rem 浏览宿主；分区/筛选/状态/列表/处理原因与权限沿用原治理能力。 |
| Community | `/c/:slug/manage/members/:itemId` | ManageView.vue | 社区治理 | 已完成（待批阅） | 按原语义此 section 的 itemId 不触发编辑，继续列表/治理操作，使用相同浏览宿主。 |
| Team | `/doc` | DocumentView.vue | 工作区阅读 | 已完成（待批阅） | 本轮移除对象详情外壳和重复标题；返回/编辑 → 文档元信息 → 72ch 正文；缺 id/受限/加载/错误保留。 |
| Weibo | `/personal/feed` | FeedView.vue | 个人信息流 | 已完成（待批阅） | 本轮 52rem 连续文章替代资源目录行；账号置前，动作紧随正文；无限加载/权限/草稿/轮询不变。 |
| Site | `/` | App.vue | 品牌长页 | 已完成（待批阅） | 本轮章节标题与说明分栏；优势连续叙述，移除写死高度的增长图及专属 CSS；品牌/成员/服务/入口保留。 |

Community 治理实际 router 约束仍为 `/c/:slug/manage/:section(boards|announcements|posts|comments|members)/:itemId?`；上表按 section 与 itemId 分别展开，没有为 posts/comments/members 新增详情行为。

## 共享源码与所有权

- 两个帖子编辑路由指向独立 PostFormView，本聊天未开始、归第四 / 专注编辑对话；帖子阅读及评论编辑仍属于本聊天 PostView。
- 新增 CommunityBrowsePage，仅用于本应用目录、首页、治理三个页面。无请求、状态或权限 props；header 与默认插槽拥有宽度、间距和边界，不穿透公共组件。
- ManageView 通过外部宽度收窄治理编辑。公共 CommunityGovernance 未修改，Team/Admin 不受影响。
- 新应用组件未登记公共 catalog：本轮禁止修改公共预览注册文件；提供真实页面附件，登记由主对话整合时决定。
- 排除 Shop /manage、Team/Admin 社区管理；Shop 公共兜底不在最新明确清单，保持原样。全局 shell、router、公共 UI、总覆盖清单、人工用户文档均未改。

## 真实预览与验收边界

使用本地 Vite 渲染真实 Vue 页面，浏览器拦截业务 API，使用标注模拟数据的 fixture，非本地网络全部中止。脚本 `.codex/public-reading/render.mjs`，图片与报告在 `.codex/public-reading/previews/`。代表页为 Shop 结算/卡密、Community 广场/帖子/板块治理、Team 文档、Weibo 信息流、Display 文档及 Site 首页，共 9 张；Site 使用源码内置 fallback 内容，/api/site-content 故意返回不可用，没有读取生产数据。

按 preview-components 技能生成 LsMarkdownRenderer、WeiboAccountField 两张登记组件附件，位于 frontend/component-previews/generated。PNG 为人类专用，没有打开、OCR 或用于判断视觉效果。

附件不是功能、权限、窄屏、200% 文字、保存、回归、类型检查或发布构建验收。没有点击提交/退款/治理动作，正式验收由主对话统一执行。

## Git 生命周期

独立分支保留，本文件所在提交包含本轮完整实现，结束状态为“已完成等待审查”；不合 main、不推送、不部署、不删除环境。

