# 后台介绍文案选稿 · demo 团队

更新日期：2026-10-02。仅保留后台可见的介绍文案；原有候选编号与 A/B/C 保持不变，删除项留号不重排。

共 **101 组文案、303 条候选**，另有 **4 组概览勾选列表，每组 10 条可多选**。每组均附对应后台页面网址及必要的进入步骤。

选稿格式：`C001 A，C006 C；L1 选 1、3、6；L3 选 2、5、8`。普通文案每组单选，列表可多选。

## 页面访问说明

- 以下网址使用 demo 的标准团队域名。账号和平台后台不绑定团队，分别使用 `account.lostsky.work` 与 `admin.lostsky.work`。
- 先[登录账号](https://account.lostsky.work/login)，再在[身份选择](https://account.lostsky.work/identity)中选择 demo 团队内可用身份。个人后台要求身份归属 demo；外部人员进入团队后台还需 demo 的角色授权。
- 平台管理页面需要有效的平台管理员角色及相应平台权限，不会因为你能管理 demo 团队就自动开放。
- 链接只提供导航，不授予权限。部分原文只在空数据、加载失败、受限状态或确认弹窗中出现，已逐项注明；不能保证使用任意账号打开都会出现。
- 详情、编辑、充值页使用实际记录的编号或标识。未编造 demo 数据 ID：不能固定直达的条目链接到列表，并注明打开步骤。只查看文案，不需要完成保存、授权、发送或充值。
- 已按当前 Wiki、域名生成函数和路由源码核对链接；本次未登录线上逐页验证 demo 的部署、数据或权限，链接不代表已确认线上原文与本地一致。

网址依据：[请求路由与应用解析](../architecture/routing.md)、[前端路由与页面导航](../architecture/frontend-navigation.md)、[域名生成方法](C:/awesome-lostsky/frontend/packages/shared/src/navigation.ts)。

## 1. 概览页面的勾选列表

### L1 · 团队 · 个人概览 /personal

**页面**：[https://demo.team.lostsky.work/personal](https://demo.team.lostsky.work/personal)

使用 demo 团队内当前人员身份查看。

**源码**：[frontend/apps/team/src/views/PersonalView.vue:94](C:/awesome-lostsky/frontend/apps/team/src/views/PersonalView.vue:94)

当前文案：

- 所有资料和业务范围都以当前已领取的人员为主体。
- 切换身份后，系统会重新核对人员类型、角色与有效权限。

可多选：此处是你在团队中的个人中心，部分内容受团队管理或需要权限

1. 在这里管理当前身份的资料与公开介绍。
2. 名称、头像和简介可按当前身份分别维护。
3. 团队自定义字段集中在资料入口填写。
4. 随时查看当前身份的角色与有效权限。
5. 角色来源与实际授权范围可直接查阅。
6. 团队发给当前身份的通知会进入收件箱。
7. 切换身份后，将显示新身份的资料与权限。
8. 个人资料按当前身份保存，切换身份不会混用。
9. 通过分享链接访问团队商城或公开主页。
10. 需要处理团队管理事务时，可切换到团队工作台。

### L2 · 记账 · 个人概览 /personal

**页面**：[https://demo.transaction.lostsky.work/personal](https://demo.transaction.lostsky.work/personal)

使用 demo 团队内当前人员身份查看。

**源码**：[frontend/apps/transaction/src/views/PersonalOverviewView.vue:47](C:/awesome-lostsky/frontend/apps/transaction/src/views/PersonalOverviewView.vue:47)

当前文案：

- 仅统计当前身份参与的业务；团队管理权限不会扩大个人数据范围。

可多选：团队流水需切换至团队工作台,商品编辑请移步至商城工作台

1. 这里只统计当前身份参与的业务。
2. 接单、发单和接待数量分别统计。
3. 月度流水与业绩按本月汇总。
4. 在我的流水中查看本人参与的每笔记录。
5. 登记流水时，记录当前身份参与的业务。
6. 在我的接单中处理指定邀请与可领取任务。
7. 已接取的任务可继续填写资料并完成核销。
8. 我的顾客合并展示本人负责与协作发单的顾客。
9. 在权益下发中查看本人直接发放的顾客权益。
10. 团队管理权限不会扩大个人工作台的数据范围。

### L3 · 微博 · 个人概览 /personal

**页面**：[https://demo.weibo.lostsky.work/personal](https://demo.weibo.lostsky.work/personal)

使用 demo 团队内当前人员身份查看。

**源码**：[frontend/apps/weibo/src/views/OverviewView.vue:102](C:/awesome-lostsky/frontend/apps/weibo/src/views/OverviewView.vue:102)

当前文案：

- 账号、任务和日志固定在当前人员范围，页面不提供跨人员筛选。
- 远端写入和任务开启/恢复会在用户提交动作时核对 Weibo Ability。

可多选：管理当前人员的微博账号与任务,无权限或能力时可预先配置

1. 管理当前身份的微博账号与任务。
2. 绑定账号后，可随时检查登录状态。
3. 浏览点单信息流，选择帖子后手动评论。
4. 团队和个人预设评论都可在互动时选用。
5. 超话发帖最多可添加九张图片。
6. 点赞和评论由你确认后手动发送。
7. 可配置自动发帖或每日超话签到。
8. 任务保存后先暂停，确认配置后再开启。
9. 受阻任务恢复条件后，需要手动重新开启。
10. 执行日志保留最近三十天的结果。

### L4 · 微博 · 团队概览 /overview

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)

当前身份须符合上述后台访问条件；微博团队列表在读取受限时不显示。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:214](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:214)

当前文案：

- 远端写入和任务开启或恢复，会在提交动作时核对 Weibo Ability。

可多选：集中管理团队运行任务,需要购买微博能力方可使用

1. 集中查看团队微博账号的登录状态。
2. 从概览了解正在运行与等待处理的任务。
3. 下一次执行时间集中显示，便于核对安排。
4. 失效账号与受阻任务可在这里及时发现。
5. 最近的失败与未确认结果单独汇总。
6. 团队账号可用于手动发帖与互动。
7. 自动任务可从候选账号中选择可用账号执行。
8. 支持自动超话发帖与每日超话签到。
9. 修改任务后会暂停，确认配置后再开启。
10. 通过执行日志回看最近三十天的结果。

## 2. 逐条候选

每组的“页面”链接对应原文的渲染位置。遇到动态详情，请按“查看方式”进入；标注状态的内容无需为了审稿而修改实际业务数据。

### 账号

#### C001

**页面**：[https://account.lostsky.work/identity](https://account.lostsky.work/identity)
**查看方式**：登录后打开身份选择页；与当前账号关联的可用身份决定实际内容。

**源码**：[frontend/apps/account/src/views/IdentityView.vue:70](C:/awesome-lostsky/frontend/apps/account/src/views/IdentityView.vue:70)

**原文**：业务操作将使用所领取人员的角色与权限（Permission）；账号和设备设置始终使用你的真实用户身份。

**问题**：夹英文，“领取人员”生硬。

- **A**：业务操作使用当前人员身份的角色与权限；账号和设备设置仍属于你的登录账号。
- **B**：切换人员身份后，将按该身份的权限开展业务，账号和设备设置不变。
- **C**：用当前人员身份处理业务，用登录账号管理账号与设备。

业务操作使用你登录的人员。

#### C002

**页面**：[https://account.lostsky.work/identity](https://account.lostsky.work/identity)
**查看方式**：登录后打开身份选择页；与当前账号关联的可用身份决定实际内容。

**出现条件**：尚无当前人员身份且无可领取身份时的空状态。

**源码**：[frontend/apps/account/src/views/IdentityView.vue:111](C:/awesome-lostsky/frontend/apps/account/src/views/IdentityView.vue:111)

**原文**：成员或顾客需先完成全局 slug 设置，才能作为根身份领取。

**问题**：slug、根身份属于实现术语。

- **A**：请先为成员或顾客设置全局标识，再使用该身份。
- **B**：成员或顾客资料中的全局标识设置完成后，即可切换到该身份。
- **C**：使用成员或顾客身份前，需要先补全其全局标识。

使用该人员身份前，需要先补全其全局标识。

#### C003

**页面**：[https://account.lostsky.work/identity](https://account.lostsky.work/identity)
**查看方式**：登录后打开身份选择页；与当前账号关联的可用身份决定实际内容。

**出现条件**：尚未领取人员身份时出现。

**源码**：[frontend/apps/account/src/views/IdentityView.vue:82](C:/awesome-lostsky/frontend/apps/account/src/views/IdentityView.vue:82)

**原文**：先领取与你的账号直接关联的成员或顾客根身份。

**问题**：“领取根身份”难懂。

- **A**：先选择与你的账号关联的成员或顾客身份。
- **B**：请选择你在团队中的成员身份，或在商家的顾客身份。
- **C**：从与你的账号关联的身份中选择一个开始使用。

您的业务操作需要您领取人员身份。

#### C004

**页面**：[https://account.lostsky.work/identity/workspace-warning?team_slug=demo&redirect=https%3A%2F%2Fdemo.team.lostsky.work%2F](https://account.lostsky.work/identity/workspace-warning?team_slug=demo&redirect=https%3A%2F%2Fdemo.team.lostsky.work%2F)
**查看方式**：需要当前身份属于其他团队且获 demo 授权，外部身份提醒状态才会显示这段原文；同团队身份不会显示。

**源码**：[frontend/apps/account/src/views/WorkspaceWarningView.vue:79](C:/awesome-lostsky/frontend/apps/account/src/views/WorkspaceWarningView.vue:79)

**原文**：当前代表的是其他团队的人员。继续后，业务操作将使用目标团队授予该人员的 Permission。

**问题**：英文混入，指代繁复。

- **A**：你正以其他团队的人员身份进入。继续后，可使用目标团队授予此身份的权限。
- **B**：继续进入后，你将以当前人员身份开展业务，操作范围由目标团队的授权决定。
- **C**：当前身份不属于目标团队；进入后仅可处理目标团队已授权的业务。

C

### 团队

#### C005

**页面**：[https://demo.team.lostsky.work/abilities](https://demo.team.lostsky.work/abilities)
**查看方式**：需团队能力查看/兑换权限；C006 位于兑换码表单说明，无需提交兑换。

**源码**：[frontend/apps/team/src/views/AbilitiesView.vue:28](C:/awesome-lostsky/frontend/apps/team/src/views/AbilitiesView.vue:28)

**原文**：查看当前 Ability 等级与有效期，并在确认权益内容后兑换平台卡密。

**问题**：Ability 无需英文括注。

- **A**：查看团队能力的等级与有效期，或使用平台兑换码开通能力。
- **B**：查看已开通的团队能力，并兑换新的能力权益。
- **C**：核对团队能力与到期时间，确认兑换内容后开通。

查看与兑换团队能力。

#### C006

**页面**：[https://demo.team.lostsky.work/abilities](https://demo.team.lostsky.work/abilities)
**查看方式**：需团队能力查看/兑换权限；C006 位于兑换码表单说明，无需提交兑换。

**源码**：[frontend/apps/team/src/views/AbilitiesView.vue:28](C:/awesome-lostsky/frontend/apps/team/src/views/AbilitiesView.vue:28)

**原文**：先检查活动、Ability、等级和持续天数，再确认写入团队授权。

**问题**：技术术语替代用户结果。

- **A**：先核对活动、团队能力、等级和有效天数，再确认兑换。
- **B**：输入兑换码，确认可获得的能力与有效期后兑换。
- **C**：查看兑换码对应的能力权益，确认后应用到当前团队。

C

#### C007

**页面**：[https://demo.team.lostsky.work/chat-virtuals](https://demo.team.lostsky.work/chat-virtuals)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/ChatVirtualsView.vue:31](C:/awesome-lostsky/frontend/apps/team/src/views/ChatVirtualsView.vue:31)

**原文**：以同一套通用能力（Ability）承载人工代操作、Webhook，以及未来的 LLM 或工作流。

**问题**：混淆能力与虚拟人员；未来功能不宜作当前介绍。

- **A**：创建独立的虚拟身份，供成员代为操作或连接外部系统。
- **B**：管理客服等虚拟人员，并通过授权安排成员操作或系统接入。
- **C**：为团队建立虚拟人员，分配角色后用于业务操作与外部集成。

C

#### C008

**页面**：[https://demo.team.lostsky.work/chat-virtuals](https://demo.team.lostsky.work/chat-virtuals)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：虚拟人员列表为空时出现。

**源码**：[frontend/apps/team/src/views/ChatVirtualsView.vue:45](C:/awesome-lostsky/frontend/apps/team/src/views/ChatVirtualsView.vue:45)

**原文**：创建后可通过角色授予全局或指定 slug 的管理、操作与字段范围。

**问题**：slug 与“范围”堆叠。

- **A**：创建虚拟人员后，可通过角色设置其业务权限。
- **B**：为虚拟人员分配角色，限定可管理的人员、资料和业务。
- **C**：创建后请配置角色与权限，再安排成员操作或接入系统。

请先创建虚拟人员。

#### C009

**页面**：[https://demo.team.lostsky.work/chat-virtual-new](https://demo.team.lostsky.work/chat-virtual-new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/ChatVirtualFormView.vue:69](C:/awesome-lostsky/frontend/apps/team/src/views/ChatVirtualFormView.vue:69)

**原文**：slug 用于 URL、权限（Permission）和集成身份；确定后不可修改或复用。

**问题**：面向普通管理员过度技术化，需保留不可逆边界。

- **A**：全局标识用于访问地址、权限配置和外部集成，创建后不可修改或重复使用。
- **B**：请为虚拟人员设置唯一标识；它会用于访问与授权，确认后不能更改或复用。
- **C**：标识将用于识别此虚拟人员，供访问、授权及系统接入使用；创建后不可更改或复用。

您需要为虚拟人员设置标识。

#### C010

**页面**：[https://demo.team.lostsky.work/field-new](https://demo.team.lostsky.work/field-new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/EntityFieldFormView.vue:142](C:/awesome-lostsky/frontend/apps/team/src/views/EntityFieldFormView.vue:142)

**原文**：字段定义属于团队；值按对象类型与内部 ID 关联，不把数字 ID 暴露到权限（Permission） key。

**问题**：全是存储和权限实现，与创建字段任务无关。

- **A**：为团队人员设置自定义资料字段，并配置填写与查看范围。
- **B**：定义需要收集的资料，以及谁可以查看和修改。
- **C**：配置人员资料的字段名称、输入方式和访问规则。

#### C011

**页面**：[https://demo.team.lostsky.work/fields](https://demo.team.lostsky.work/fields)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/EntityFieldsView.vue:38](C:/awesome-lostsky/frontend/apps/team/src/views/EntityFieldsView.vue:38)

**原文**：统一定义人员、顾客和虚拟人员的团队内部业务资料；顾客公开资料仍由顾客本人维护。

**问题**：人员包含顾客，层级混杂；字段已有公开可见选项。

- **A**：配置成员、顾客和虚拟人员的自定义资料字段及访问范围。
- **B**：按人员类型定义团队需要收集的资料，分别设置维护和可见范围。
- **C**：管理团队自定义资料字段；顾客的个人简介等资料仍由顾客本人维护。

#### C012

**页面**：[https://demo.team.lostsky.work/fields](https://demo.team.lostsky.work/fields)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：对应类型字段列表为空时出现。

**源码**：[frontend/apps/team/src/views/EntityFieldsView.vue:50](C:/awesome-lostsky/frontend/apps/team/src/views/EntityFieldsView.vue:50)

**原文**：字段值只在团队内部使用，不会自动成为公开资料。

**问题**：“只在内部”与公开字段能力冲突。 已在 EntityFieldFormView 的公开可见选项核实。

- **A**：创建字段后，可分别设置谁能填写、查看和修改。
- **B**：字段是否公开取决于可见范围和人员的公开展示设置。
- **C**：先创建团队需要的资料字段，再配置相应的访问范围。

#### C013

**页面**：[https://demo.team.lostsky.work/roles/entities](https://demo.team.lostsky.work/roles/entities)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/EntityRolesView.vue:136](C:/awesome-lostsky/frontend/apps/team/src/views/EntityRolesView.vue:136)

**原文**：按名称或全局 slug 搜索人员并授予当前团队角色。成员、顾客、团队和虚拟人员在这里使用同一套分配流程。

**问题**：夹英文，后半句解释实现流程。

- **A**：按名称或全局标识查找人员，为其分配当前团队的角色。
- **B**：查找成员、顾客、团队或虚拟人员，授予相应角色。
- **C**：选择要授权的人员，再设置其在当前团队中的角色。

#### C014

**页面**：[https://demo.team.lostsky.work/entities](https://demo.team.lostsky.work/entities)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/EntitiesView.vue:72](C:/awesome-lostsky/frontend/apps/team/src/views/EntitiesView.vue:72)

**原文**：浏览团队、成员、顾客与虚拟人员。具有全量读取权限（Permission）时也会列出团队内隐藏人员。

**问题**：不必要的英文括注。

- **A**：查看团队、成员、顾客与虚拟人员；拥有全量读取权限时，也可查看团队内隐藏的人员。
- **B**：查找团队中的各类人员。隐藏人员仅向拥有全量读取权限的人展示。
- **C**：浏览可见人员资料；有全量读取权限时可一并查看隐藏人员。

#### C015

**页面**：[https://demo.team.lostsky.work/members](https://demo.team.lostsky.work/members)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/MembersView.vue:89](C:/awesome-lostsky/frontend/apps/team/src/views/MembersView.vue:89)

**原文**：浏览团队内可见成员；具有全量读取权限（Permission）时也会列出隐藏或封禁成员。

**问题**：不必要的英文括注。

- **A**：浏览团队成员；拥有全量读取权限时，也可查看隐藏或封禁成员。
- **B**：查找团队内可见成员，有全量读取权限时可查看完整成员名单。
- **C**：查看成员资料与状态；隐藏或封禁成员仅向有全量读取权限的人展示。

#### C016

**页面**：[https://demo.team.lostsky.work/members](https://demo.team.lostsky.work/members)
**查看方式**：从成员列表选择一位真实成员，进入编辑页；此文案属于编辑状态，不是新增状态。

**源码**：[frontend/apps/team/src/views/MemberFormView.vue:291](C:/awesome-lostsky/frontend/apps/team/src/views/MemberFormView.vue:291)

**原文**：维护成员资料、对象字段、角色权限（Permission）与管理状态。

**问题**：英文夹注。

- **A**：维护成员资料、自定义字段、角色权限和成员状态。
- **B**：更新成员资料，并管理其角色、权限与状态。
- **C**：集中维护成员信息、团队资料字段及访问权限。

#### C017

**页面**：[https://demo.team.lostsky.work/roles](https://demo.team.lostsky.work/roles)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/RolesView.vue:35](C:/awesome-lostsky/frontend/apps/team/src/views/RolesView.vue:35)

**原文**：角色列表只用于查找和进入管理任务；角色资料、权限（Permission）与人员分配分别在独立页面完成。

**问题**：描述页面架构，偏离用户任务。

- **A**：管理团队角色及其权限，并为人员分配角色。
- **B**：查找已有角色，调整权限或维护人员授权。
- **C**：用角色组织团队分工，分别设置可执行的业务操作。

#### C018

**页面**：[https://demo.team.lostsky.work/roles/new](https://demo.team.lostsky.work/roles/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/RoleFormView.vue:36](C:/awesome-lostsky/frontend/apps/team/src/views/RoleFormView.vue:36)

**原文**：先建立角色，再为它分配完成工作所需的最小权限（Permission）。

**问题**：删除英文，保留最小授权含义。

- **A**：先创建角色，再授予完成工作所需的权限。
- **B**：为一类职责建立角色，并配置必要权限。
- **C**：创建角色后，选择履行该职责必需的权限。

#### C019

**页面**：[https://demo.team.lostsky.work/roles](https://demo.team.lostsky.work/roles)
**查看方式**：打开实际角色的详情页；该句是缺少角色标识时的标题说明回退文案，有标识时显示角色标识。

**源码**：[frontend/apps/team/src/views/RoleDetailView.vue:322](C:/awesome-lostsky/frontend/apps/team/src/views/RoleDetailView.vue:322)

**原文**：维护角色资料与最小权限（Permission）集合。

**问题**：生硬内部表达。

- **A**：维护角色信息及完成工作所需的权限。
- **B**：设置角色用途，并配置必要权限。
- **C**：调整角色资料与授权范围。

#### C020

**页面**：[https://demo.team.lostsky.work/roles](https://demo.team.lostsky.work/roles)
**查看方式**：打开实际角色详情，展开通用权限分组。

**源码**：[frontend/apps/team/src/views/RoleDetailView.vue:395](C:/awesome-lostsky/frontend/apps/team/src/views/RoleDetailView.vue:395)

**原文**：通用 Permission 可直接授权团队范围或一类人员；保存时会移除已被覆盖的指定 slug。

**问题**：英文与实现术语混合，保存影响应保留。

- **A**：通用权限可覆盖整个团队或某类人员；保存时会移除已被覆盖的单个人员授权。
- **B**：按团队或人员类型统一授权后，重复的单个人员授权将自动合并。
- **C**：通用授权适用于团队或一类人员；已包含在其中的单独授权会在保存时移除。

#### C021

**页面**：[https://demo.team.lostsky.work/roles](https://demo.team.lostsky.work/roles)
**查看方式**：打开实际角色详情，展开高级范围权限区域。

**源码**：[frontend/apps/team/src/views/RoleDetailView.vue:478](C:/awesome-lostsky/frontend/apps/team/src/views/RoleDetailView.vue:478)

**原文**：父级 Permission 会覆盖当前及未来新增的同前缀子权限。只在职责边界稳定、确实需要整段授权时使用。

**问题**：不必要英文，保留未来权限风险。

- **A**：父级权限会包含当前及未来新增的同组子权限，请仅在需要整组授权时使用。
- **B**：授予父级权限后，同组现有和新增权限都会生效，请确认职责范围。
- **C**：仅在需要完整授权该组职责时选择父级权限；未来新增的子权限也会包含在内。

#### C022

**页面**：[https://demo.team.lostsky.work/roles](https://demo.team.lostsky.work/roles)
**查看方式**：打开实际角色详情；原文仅在新增高级范围权限后的保存确认弹窗内显示，不在常态页面中。仅审阅文案时不要完成“确认并保存”。

**源码**：[frontend/apps/team/src/views/RoleDetailView.vue:534](C:/awesome-lostsky/frontend/apps/team/src/views/RoleDetailView.vue:534)

**原文**：以下父级 Permission 会同时覆盖当前列出的权限，以及未来新增的同前缀权限：

**问题**：夹英文。

- **A**：以下父级权限将覆盖当前列出的子权限，以及未来新增的同组权限：
- **B**：请确认整组授权范围：下列父级权限也会包含今后新增的子权限。
- **C**：授予以下父级权限后，当前及未来新增的同组子权限都会生效：

#### C023

**页面**：[https://demo.team.lostsky.work/notices/team](https://demo.team.lostsky.work/notices/team)
**查看方式**：从团队平台通知列表打开一条实际通知；须具备通知读取权限。

**源码**：[frontend/apps/team/src/views/NoticeDetailView.vue:35](C:/awesome-lostsky/frontend/apps/team/src/views/NoticeDetailView.vue:35)

**原文**：查看 LostSky 发给 Team 的完整通知。

**问题**：Team 泄露。

- **A**：查看平台发给当前团队的完整通知。
- **B**：阅读平台通知的正文与发送时间。
- **C**：查看当前团队收到的平台通知。

#### C024

**页面**：[https://demo.team.lostsky.work/personal/notices](https://demo.team.lostsky.work/personal/notices)
**查看方式**：从当前身份收件箱打开一条实际通知。

**源码**：[frontend/apps/team/src/views/NoticeDetailView.vue:42](C:/awesome-lostsky/frontend/apps/team/src/views/NoticeDetailView.vue:42)

**原文**：查看 Team 发给当前人员的完整通知。

**问题**：Team 泄露。

- **A**：查看团队发给当前人员的完整通知。
- **B**：阅读发给当前身份的团队通知。
- **C**：查看当前人员收到的通知正文。

#### C025

**页面**：[https://demo.team.lostsky.work/notices/send](https://demo.team.lostsky.work/notices/send)
**查看方式**：需通知发送权限；打开表单即可查看，不需要实际发送。

**源码**：[frontend/apps/team/src/views/NoticeSendView.vue:121](C:/awesome-lostsky/frontend/apps/team/src/views/NoticeSendView.vue:121)

**原文**：由有权限（Permission）的当前人员代表 Team，向同 Team 的一位人员发送单向通知。

**问题**：多处英文、句子拗口。

- **A**：代表当前团队，向团队内一位人员发送通知；需要具备通知发送权限。
- **B**：选择团队内的收件人，以团队名义发送单向通知。
- **C**：有发送权限时，可代表团队向本团队人员发送一对一通知。

#### C026

**页面**：[https://demo.team.lostsky.work/notices/send](https://demo.team.lostsky.work/notices/send)
**查看方式**：需通知发送权限；打开表单即可查看，不需要实际发送。

**源码**：[frontend/apps/team/src/views/NoticeSendView.vue:132](C:/awesome-lostsky/frontend/apps/team/src/views/NoticeSendView.vue:132)

**原文**：可选择 Team、成员、顾客或虚拟人员；结果包含类型与全局标识，避免发给同名对象。

**问题**：Team 无需英文。

- **A**：可选择团队、成员、顾客或虚拟人员，请核对类型与全局标识。
- **B**：按名称查找收件人，并通过类型和全局标识确认身份。
- **C**：选择本团队内的收件人；同名时请核对人员类型和标识。

#### C027

**页面**：[https://demo.team.lostsky.work/notices/send](https://demo.team.lostsky.work/notices/send)
**查看方式**：需通知发送权限；打开表单即可查看，不需要实际发送。

**源码**：[frontend/apps/team/src/views/NoticeSendView.vue:129](C:/awesome-lostsky/frontend/apps/team/src/views/NoticeSendView.vue:129)

**原文**：通知只进入所选人员的收件箱，不支持回复、抄送或会话；发送方统一显示为当前 Team。

**问题**：夹英文，边界有价值。

- **A**：通知仅发送到所选人员的收件箱，发送方显示为当前团队；不支持回复或抄送。
- **B**：收件人会收到以当前团队名义发送的通知，该通知不能回复或抄送。
- **C**：这是一条单向通知，只送达所选人员；需要往来沟通时请使用聊天。

#### C028

**页面**：[https://demo.team.lostsky.work/notices/team](https://demo.team.lostsky.work/notices/team)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/NoticesView.vue:50](C:/awesome-lostsky/frontend/apps/team/src/views/NoticesView.vue:50)

**原文**：LostSky 发给 Team 的共享通知

**问题**：Team 泄露。

- **A**：平台发给当前团队的通知
- **B**：查看当前团队收到的平台通知
- **C**：接收平台面向团队发送的通知

#### C029

**页面**：[https://demo.team.lostsky.work/personal/notices](https://demo.team.lostsky.work/personal/notices)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/NoticesView.vue:57](C:/awesome-lostsky/frontend/apps/team/src/views/NoticesView.vue:57)

**原文**：当前人员收到的 Team 单向通知

**问题**：Team 泄露。

- **A**：当前人员收到的团队通知
- **B**：查看发给当前身份的通知
- **C**：阅读团队发来的单向通知

#### C030

**页面**：[https://demo.team.lostsky.work/notices/team](https://demo.team.lostsky.work/notices/team)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：团队平台通知列表为空时出现。

**源码**：[frontend/apps/team/src/views/NoticesView.vue:53](C:/awesome-lostsky/frontend/apps/team/src/views/NoticesView.vue:53)

**原文**：LostSky 发给 Team 的通知会显示在这里。

**问题**：Team 泄露。

- **A**：平台发给当前团队的通知会显示在这里。
- **B**：收到平台通知后，可在这里查看。
- **C**：这里将显示当前团队收到的平台通知。

#### C031

**页面**：[https://demo.team.lostsky.work/personal/notices](https://demo.team.lostsky.work/personal/notices)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：个人通知列表为空时出现。

**源码**：[frontend/apps/team/src/views/NoticesView.vue:60](C:/awesome-lostsky/frontend/apps/team/src/views/NoticesView.vue:60)

**原文**：Team 发给当前人员的通知会显示在这里。

**问题**：Team 泄露。

- **A**：团队发给当前人员的通知会显示在这里。
- **B**：收到团队通知后，可在这里阅读。
- **C**：这里将显示发给当前身份的团队通知。

#### C032

**页面**：[https://demo.team.lostsky.work/personal](https://demo.team.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/PersonalView.vue:63](C:/awesome-lostsky/frontend/apps/team/src/views/PersonalView.vue:63)

**原文**：只读查看角色来源与当前实际生效的 Permission。

**问题**：夹英文，生硬。

- **A**：查看角色来源和当前有效权限。
- **B**：了解当前身份获得了哪些角色与权限。
- **C**：查看当前身份可执行的操作及授权来源。

#### C033

**页面**：[https://demo.team.lostsky.work/personal](https://demo.team.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：当前身份摘要未能加载时使用的回退介绍。

**源码**：[frontend/apps/team/src/views/PersonalView.vue:54](C:/awesome-lostsky/frontend/apps/team/src/views/PersonalView.vue:54)

**原文**：资料、对象字段和权限（Permission）入口保持可用；重新进入页面后会再次读取当前身份。

**问题**：把状态与页面实现写成介绍。

- **A**：可继续进入资料、自定义字段和角色权限页面。
- **B**：当前身份资料暂未显示，可从下方入口继续查看。
- **C**：通过下方入口管理资料，或查看当前身份的角色与权限。

#### C034

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/SettingsView.vue:151](C:/awesome-lostsky/frontend/apps/team/src/views/SettingsView.vue:151)

**原文**：配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。

**问题**：介绍后端实现，没有帮助用户理解配置目标。

- **A**：按业务分类调整团队设置，修改后保存对应分组。
- **B**：管理团队各项业务设置，分别保存需要调整的内容。
- **C**：设置团队的日常业务规则与默认值。

#### C035

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：没有可配置项时出现；受限空状态可能替换为权限原因。

**源码**：[frontend/apps/team/src/views/SettingsView.vue:156](C:/awesome-lostsky/frontend/apps/team/src/views/SettingsView.vue:156)

**原文**：应用登记团队设置后会自动显示在这里。

**问题**：开发语言。

- **A**：当前没有可配置的团队设置。
- **B**：暂无团队设置项，可稍后再查看。
- **C**：该团队目前没有需要配置的设置项。

#### C036

**页面**：[https://demo.team.lostsky.work/doc-create](https://demo.team.lostsky.work/doc-create)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/DocumentFormView.vue:123](C:/awesome-lostsky/frontend/apps/team/src/views/DocumentFormView.vue:123)

**原文**：使用可视化编辑器整理长期知识；输入 @ 可插入团队或成员对象。

**问题**：文档用途过窄，人员引用不只成员。

- **A**：编写文档内容，输入 @ 可引用团队或人员。
- **B**：整理业务资料与说明，并按需插入人员引用。
- **C**：使用编辑器编写文档，输入 @ 查找并引用相关人员。

#### C037

**页面**：[https://demo.team.lostsky.work/docs](https://demo.team.lostsky.work/docs)
**查看方式**：从文档列表打开一份实际可读文档；详情链接由记录携带有效文档编号。

**源码**：[frontend/apps/team/src/views/DocumentView.vue:98](C:/awesome-lostsky/frontend/apps/team/src/views/DocumentView.vue:98)

**原文**：阅读团队沉淀的流程、规范与长期知识。

**问题**：任意文档可能是顾客资料、价格等，不应预设内容。

- **A**：阅读文档正文及相关资料。
- **B**：查看文档内容、归属与访问范围。
- **C**：查看当前文档的完整内容。

#### C038

**页面**：[https://demo.team.lostsky.work/docs](https://demo.team.lostsky.work/docs)
**查看方式**：从文档列表打开一份实际可读文档；详情链接由记录携带有效文档编号。

**出现条件**：文档正文为空时出现。

**源码**：[frontend/apps/team/src/views/DocumentView.vue:145](C:/awesome-lostsky/frontend/apps/team/src/views/DocumentView.vue:145)

**原文**：可以进入编辑页补充内容，标题和访问规则会保持不变。

**问题**：编辑页允许改标题/访问规则，该承诺不精准。

- **A**：可进入编辑页补充文档内容。
- **B**：点击编辑，完善这份文档。
- **C**：需要补充资料时，可继续编辑文档。

#### C039

**页面**：[https://demo.team.lostsky.work/join-review](https://demo.team.lostsky.work/join-review)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/team/src/views/JoinReviewView.vue:37](C:/awesome-lostsky/frontend/apps/team/src/views/JoinReviewView.vue:37)

**原文**：查看申请状态，选择一条申请进入独立审核页面。

**问题**：“独立页面”无关。

- **A**：查看加入或复职申请，核对资料并处理审核。
- **B**：跟进申请状态，选择待处理申请继续审核。
- **C**：查看申请资料、审核任务与处理结果。

#### C040

**页面**：[https://demo.team.lostsky.work/personal/access](https://demo.team.lostsky.work/personal/access)
**查看方式**：查看当前身份的角色与权限卡片。

**源码**：[frontend/apps/team/src/components/EntityPermissionsCard.vue:178](C:/awesome-lostsky/frontend/apps/team/src/components/EntityPermissionsCard.vue:178)

**原文**：以下按当前团队分配角色中的权限（Permission）记录逐条展示。

**问题**：英文与数据记录描述生硬。

- **A**：以下列出当前团队角色授予的权限。
- **B**：查看当前团队为该人员授予的角色权限。
- **C**：这里显示来自当前团队角色的各项权限。

#### C127

**页面**：[https://demo.team.lostsky.work/customers](https://demo.team.lostsky.work/customers)
**查看方式**：打开一位实际顾客的详情，在协作发单人字段下查看说明；需具有相应读取权限，编辑需顾客管理权限。

**源码**：[frontend/apps/team/src/views/CustomerDetailView.vue:175](C:/awesome-lostsky/frontend/apps/team/src/views/CustomerDetailView.vue:175)

**原文**：可多选；这些人员仍需具备记账 Ability 与对应 Permission，才能协作处理该顾客。

**问题**：夹英文，且把能力要求泛化到所有协作处理；读权限与提交限制应区分。 候选仅说明绑定范围，不代表自动授予业务权限。

- **A**：可选择多位协作发单人，具体业务仍按各自权限与操作条件执行。
- **B**：允许所选人员协作发单；查看与操作范围以其实际授权为准。
- **C**：可添加多位协作人员，授权后按各自可用的业务功能处理该顾客。

### 商品

#### C041

**页面**：[https://demo.shop.lostsky.work/manage](https://demo.shop.lostsky.work/manage)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/shop/src/views/manage/ManageOverviewView.vue:25](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/ManageOverviewView.vue:25)

**原文**：统一管理普通商品、核销商品、卡密和套餐，在订单中跟进交付。

**问题**：枚举遗漏多规格商品。

- **A**：统一管理各类商品，并在订单中跟进交付。
- **B**：管理普通、核销、卡密、套餐和多规格商品，查看订单进展。
- **C**：维护商品、价格和交付配置，跟进销售订单。

#### C042

**页面**：[https://demo.shop.lostsky.work/manage](https://demo.shop.lostsky.work/manage)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.shop.lostsky.work/manage/personal](https://demo.shop.lostsky.work/manage/personal)
**查看方式**：个人概览的创建商品步骤也有相同原文。

**源码**：[frontend/apps/shop/src/views/manage/ManageOverviewView.vue:18](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/ManageOverviewView.vue:18)；[frontend/apps/shop/src/views/manage/PersonalOverviewView.vue:30](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/PersonalOverviewView.vue:30)

**原文**：选择普通商品、核销商品、卡密或套餐。

**问题**：两个概览共用文案均遗漏多规格。

- **A**：选择适合业务的商品类型。
- **B**：创建普通、核销、卡密、套餐或多规格商品。
- **C**：按销售与交付方式创建商品。

#### C043

**页面**：[https://demo.shop.lostsky.work/manage/personal](https://demo.shop.lostsky.work/manage/personal)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/shop/src/views/manage/PersonalOverviewView.vue:18](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/PersonalOverviewView.vue:18)

**原文**：管理专属人员为当前身份的商品、接单人和核销字段。

**问题**：数据库式归属表达。

- **A**：管理属于当前身份的商品、接单配置和核销字段。
- **B**：维护我的商品，并设置接单人和核销资料。
- **C**：查看并管理本人商品的销售与核销配置。

#### C044

**页面**：[https://demo.shop.lostsky.work/manage/personal/products](https://demo.shop.lostsky.work/manage/personal/products)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/shop/src/views/manage/ProductsView.vue:88](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/ProductsView.vue:88)

**原文**：只管理专属人员为当前身份的商品、履约方式与接单配置。

**问题**：数据库式归属表达。

- **A**：管理属于当前身份的商品及其交付、接单配置。
- **B**：维护我的商品、交付方式和接单安排。
- **C**：查看和调整本人商品的销售与交付设置。

#### C045

**页面**：[https://demo.shop.lostsky.work/manage/products/new](https://demo.shop.lostsky.work/manage/products/new)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.shop.lostsky.work/manage/personal/products/new](https://demo.shop.lostsky.work/manage/personal/products/new)
**查看方式**：本人商品新建页复用同一介绍。

**源码**：[frontend/apps/shop/src/views/manage/ProductFormView.vue:340](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/ProductFormView.vue:340)

**原文**：商品类型决定订单完成时的履约结果；服务和卡密配置由后端再次校验。

**问题**：后端校验无关，未说明实际编辑目标。

- **A**：设置商品类型、价格与交付内容。
- **B**：维护商品资料，并配置购买后的交付方式。
- **C**：创建可售商品，按类型设置核销、卡密或组合内容。

#### C046

**页面**：[https://demo.shop.lostsky.work/manage/orders/new](https://demo.shop.lostsky.work/manage/orders/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/shop/src/views/manage/OrderFormView.vue:42](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/OrderFormView.vue:42)

**原文**：由服务端重新读取商品并计算价格与分成；服务商品和卡商品无需选择接单人。

**问题**：后端实现与旧商品名混用。

- **A**：选择商品和数量，系统会按商品配置计算价格与分成。
- **B**：为顾客创建订单，并核对商品、数量和参与人员。
- **C**：按商品当前配置创建订单，价格与分成由系统计算。

#### C047

**页面**：[https://demo.shop.lostsky.work/manage/personal/orders](https://demo.shop.lostsky.work/manage/personal/orders)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/shop/src/views/manage/PersonalOrdersView.vue:26](C:/awesome-lostsky/frontend/apps/shop/src/views/manage/PersonalOrdersView.vue:26)

**原文**：仅显示当前人员作为接单人或发单人参与的订单；范围由服务端固定。

**问题**：后半句实现细节。

- **A**：查看当前身份作为接单人或发单人参与的订单。
- **B**：跟进本人接单或发单的订单。
- **C**：这里只显示当前身份参与接单或发单的业务订单。

#### C048

**页面**：[https://demo.shop.lostsky.work/manage](https://demo.shop.lostsky.work/manage)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.shop.lostsky.work/manage/personal](https://demo.shop.lostsky.work/manage/personal)
**查看方式**：个人概览的订单分区也有相同原文。

**源码**：[frontend/apps/shop/src/components/ShopOverviewWorkspace.vue:21](C:/awesome-lostsky/frontend/apps/shop/src/components/ShopOverviewWorkspace.vue:21)

**原文**：从订单确认业务结果，继续处理每一份服务。

**问题**：订单也包含普通商品，过度聚焦服务。

- **A**：查看订单状态，跟进商品交付。
- **B**：从订单了解销售与交付进展。
- **C**：核对订单结果，处理后续交付事项。

### 记账

#### C052

**页面**：[https://demo.transaction.lostsky.work/transactions](https://demo.transaction.lostsky.work/transactions)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/TransactionsView.vue:71](C:/awesome-lostsky/frontend/apps/transaction/src/views/TransactionsView.vue:71)

**原文**：通过对流水的实时查看，您可对商业状态了如指掌。

**问题**：夸张且暗示实时更新。

- **A**：按条件查看团队流水，核对收支与参与人员。
- **B**：查询每笔收入、支出和调整记录。
- **C**：查看团队流水明细，了解业务收支情况。

#### C053

**页面**：[https://demo.transaction.lostsky.work/balances](https://demo.transaction.lostsky.work/balances)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/BalancesView.vue:37](C:/awesome-lostsky/frontend/apps/transaction/src/views/BalancesView.vue:37)

**原文**：查看顾客的可用预存款、累计充值与累计消费；充值和明细使用独立任务页。

**问题**：页面拆分无关。

- **A**：查看顾客余额、累计充值和消费，并办理充值。
- **B**：核对顾客预存款余额，查看明细或发起充值。
- **C**：管理顾客预存余额，跟进充值与消费记录。

#### C054

**页面**：[https://demo.transaction.lostsky.work/balances](https://demo.transaction.lostsky.work/balances)
**查看方式**：选择实际顾客后点击充值，打开带有效顾客标识的充值页；不要提交充值。

**源码**：[frontend/apps/transaction/src/views/RechargeView.vue:48](C:/awesome-lostsky/frontend/apps/transaction/src/views/RechargeView.vue:48)

**原文**：充值成功后会增加顾客可用余额，并写入不可遗漏的余额变动记录。

**问题**：“不可遗漏”生硬承诺。

- **A**：充值成功后，顾客可用余额会增加，并生成余额明细。
- **B**：确认充值金额后提交，结果会记录在顾客余额明细中。
- **C**：为顾客增加预存余额，每次充值都会保留记录。

#### C055

**页面**：[https://demo.transaction.lostsky.work/personal](https://demo.transaction.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.transaction.lostsky.work/personal/transactions](https://demo.transaction.lostsky.work/personal/transactions)
**查看方式**：我的流水页复用同一句介绍。

**源码**：[frontend/apps/transaction/src/views/PersonalOverviewView.vue:19](C:/awesome-lostsky/frontend/apps/transaction/src/views/PersonalOverviewView.vue:19)；[frontend/apps/transaction/src/views/PersonalWorkspaceView.vue:51](C:/awesome-lostsky/frontend/apps/transaction/src/views/PersonalWorkspaceView.vue:51)

**原文**：集中查看当前人员的角色笔数、月度数据与参与流水。

**问题**：“角色笔数”难懂，两个页面复用。

- **A**：查看自己的接单、发单、接待数量及月度业绩和流水。
- **B**：汇总本人参与的业务，查看数量、业绩与流水记录。
- **C**：查看当前身份的业务参与情况与本月数据。

#### C056

**页面**：[https://demo.transaction.lostsky.work/personal](https://demo.transaction.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/PersonalOverviewView.vue:20](C:/awesome-lostsky/frontend/apps/transaction/src/views/PersonalOverviewView.vue:20)

**原文**：查看当前人员作为处理者参与的履约任务。

**问题**：“处理者”非产品操作名。

- **A**：查看和处理当前身份的接单任务。
- **B**：查看我的接单，继续填写资料或完成核销。
- **C**：跟进本人接取的服务任务。

#### C057

**页面**：[https://demo.transaction.lostsky.work/overview](https://demo.transaction.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/TeamOverviewView.vue:18](C:/awesome-lostsky/frontend/apps/transaction/src/views/TeamOverviewView.vue:18)

**原文**：处理权益实例并记录核销过程。

**问题**：“实例”数据库术语。

- **A**：处理顾客权益核销，查看每次服务进展。
- **B**：管理核销任务及其处理记录。
- **C**：跟进权益使用、接单与核销结果。

#### C058

**页面**：[https://demo.transaction.lostsky.work/overview](https://demo.transaction.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/TeamOverviewView.vue:19](C:/awesome-lostsky/frontend/apps/transaction/src/views/TeamOverviewView.vue:19)

**原文**：查看余额、明细并按权限（Permission）执行充值。

**问题**：不必要英文，介绍强调鉴权。

- **A**：查看顾客余额与变动明细，按授权办理充值。
- **B**：查询顾客预存款，并为顾客充值。
- **C**：核对顾客余额，查看明细或进入充值。

#### C059

**页面**：[https://demo.transaction.lostsky.work/personal](https://demo.transaction.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/PersonalOverviewView.vue:51](C:/awesome-lostsky/frontend/apps/transaction/src/views/PersonalOverviewView.vue:51)

**原文**：角色参与笔数与业绩分开呈现，月度指标按本月统计。

**问题**：排版说明、“角色参与笔数”生硬。

- **A**：分别统计接单、发单和接待数量；月度数据按本月计算。
- **B**：查看各类业务参与数量及业绩，本月指标按自然月统计。
- **C**：接单、发单、接待分别计数，月度业绩与流水统计本月数据。

#### C060

**页面**：[https://demo.transaction.lostsky.work/personal/entitlements/new](https://demo.transaction.lostsky.work/personal/entitlements/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/EntitlementGrantView.vue:100](C:/awesome-lostsky/frontend/apps/transaction/src/views/EntitlementGrantView.vue:100)

**原文**：为当前人员接待的顾客直接交付 Shop 权益套餐；本操作不创建商城订单。

**问题**：Shop、交付术语混用。

- **A**：向当前身份接待的顾客下发商品中的权益，不创建商城订单。
- **B**：选择顾客和权益套餐，直接下发权益，无需创建订单。
- **C**：为接待的顾客下发权益套餐，本次操作不生成商城订单。

#### C061

**页面**：[https://demo.transaction.lostsky.work/entitlements/new](https://demo.transaction.lostsky.work/entitlements/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/transaction/src/views/EntitlementGrantView.vue:100](C:/awesome-lostsky/frontend/apps/transaction/src/views/EntitlementGrantView.vue:100)

**原文**：从 Shop 权益套餐读取权益快照并直接交付给顾客；本操作不创建商城订单。

**问题**：英文与快照实现泄露。

- **A**：选择权益套餐，直接为顾客下发权益，不创建商城订单。
- **B**：按商品当前的权益配置向顾客下发，无需生成订单。
- **C**：为顾客直接发放套餐权益，本次操作不会创建商城订单。

#### C062

**页面**：[https://demo.transaction.lostsky.work/personal/entitlements/new](https://demo.transaction.lostsky.work/personal/entitlements/new)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.transaction.lostsky.work/entitlements/new](https://demo.transaction.lostsky.work/entitlements/new)
**查看方式**：团队下发权益页也复用；仅在没有可选套餐时出现。

**出现条件**：没有可选权益套餐时出现。

**源码**：[frontend/apps/transaction/src/views/EntitlementGrantView.vue:106](C:/awesome-lostsky/frontend/apps/transaction/src/views/EntitlementGrantView.vue:106)

**原文**：先在 Shop 创建并启用关联权益包的权益套餐商品。

**问题**：Shop 泄露、旧关联模型作为操作指导；需结合实际候选接口确认迁移。 这是跨版本待核实项，选稿不能解决候选接口仍沿用旧权益包模型的问题。

- **A**：请先在商品工作台准备可下发的权益套餐。
- **B**：暂无可选权益套餐，请先到商品工作台配置。
- **C**：先创建并启用可用于权益下发的商品，再返回选择。

#### C063

**页面**：[https://demo.transaction.lostsky.work/personal/entitlements/new](https://demo.transaction.lostsky.work/personal/entitlements/new)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.transaction.lostsky.work/entitlements/new](https://demo.transaction.lostsky.work/entitlements/new)
**查看方式**：团队下发权益页的套餐选择说明也复用。

**源码**：[frontend/apps/transaction/src/views/EntitlementGrantView.vue:111](C:/awesome-lostsky/frontend/apps/transaction/src/views/EntitlementGrantView.vue:111)

**原文**：只显示 Shop 中已启用且关联有效权益包的权益套餐。

**问题**：Shop 泄露、内部关联细节。

- **A**：这里只显示当前可用于下发的权益套餐。
- **B**：选择已启用且可下发的权益套餐。
- **C**：从可下发的商品权益套餐中选择。

### 微博

#### C064

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:90](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:90)

**原文**：把账号健康、持续任务和执行结果放在同一个运行面，先判断状态，再进入具体工作。

**问题**：描述布局与设计理念，“运行面”生硬。

- **A**：查看团队微博账号、任务进度和执行结果，及时处理异常。
- **B**：统一管理团队微博工作，掌握账号状态与任务安排。
- **C**：跟进团队的发帖、互动和定时任务，查看需要处理的事项。

#### C065

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：需要概览数据可读，运行健康分区才会显示。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:157](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:157)

**原文**：账号可用性与任务状态保持并排，异常优先处理。

**问题**：“保持并排”是布局说明。

- **A**：查看账号是否可用，以及任务是否正常运行。
- **B**：及时发现失效账号与受阻任务。
- **C**：核对账号登录状态和任务执行状态。

#### C066

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：需要概览数据可读，近期记录分区才会显示。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:179](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:179)

**原文**：只收拢失败与结果未确认记录，避免正常日志干扰判断。

**问题**：设计说明多于用户信息。

- **A**：查看最近执行中失败或结果未确认的记录。
- **B**：跟进需要处理的执行异常。
- **C**：最近的失败和未确认结果集中显示在这里。

#### C067

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:193](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:193)

**原文**：从判断切换到执行。

**问题**：口号式无实际信息。

- **A**：选择要处理的微博工作。
- **B**：进入账号、发帖、互动、任务或日志。
- **C**：从下方入口继续处理具体事项。

#### C068

**页面**：[https://demo.weibo.lostsky.work/personal](https://demo.weibo.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/weibo/src/views/OverviewView.vue:82](C:/awesome-lostsky/frontend/apps/weibo/src/views/OverviewView.vue:82)

**原文**：查看最近 30 天的最小结构化执行结果。

**问题**：“最小结构化”工程术语。

- **A**：查看最近 30 天的执行结果。
- **B**：查询近 30 天的操作记录与失败原因。
- **C**：回看最近 30 天的发帖、互动和任务执行记录。

#### C069

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：不处于读取受限状态时显示。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:212](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:212)

**原文**：基础概览保持可达；账号、任务、日志与业务操作需要 weibo.team.manage Permission。

**问题**：权限键与英文泄露，开发规则叙述。

- **A**：查看和管理团队微博业务需要相应权限。
- **B**：团队账号、任务和日志按团队微博管理权限开放。
- **C**：概览入口始终可用，具体业务请按团队授权操作。

#### C070

**页面**：[https://demo.weibo.lostsky.work/overview](https://demo.weibo.lostsky.work/overview)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：不处于读取受限状态时显示。

**源码**：[frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:214](C:/awesome-lostsky/frontend/apps/weibo/src/components/TeamOverviewDashboard.vue:214)

**原文**：远端写入和任务开启或恢复，会在提交动作时核对 Weibo Ability。

**问题**：工程术语，且概览常驻能力说明与规则不一致；候选池可整体替换。

- **A**：发帖、互动及开启或恢复任务时，需要团队已开通微博能力。
- **B**：团队开通微博能力后，可执行发帖、互动和自动任务。
- **C**：微博能力有效时，可发布内容、互动并启动任务。

#### C071

**页面**：[https://demo.weibo.lostsky.work/personal](https://demo.weibo.lostsky.work/personal)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/weibo/src/views/OverviewView.vue:102](C:/awesome-lostsky/frontend/apps/weibo/src/views/OverviewView.vue:102)

**原文**：远端写入和任务开启/恢复会在用户提交动作时核对 Weibo Ability。

**问题**：同上，个人概览独立来源。

- **A**：执行发帖、互动和开启或恢复任务时，需要有效的微博能力。
- **B**：团队开通微博能力后，可使用当前身份执行微博操作。
- **C**：发布、互动和启动任务时，系统会确认微博能力是否有效。

#### C072

**页面**：[https://demo.weibo.lostsky.work/accounts](https://demo.weibo.lostsky.work/accounts)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/accounts](https://demo.weibo.lostsky.work/personal/accounts)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/AccountsView.vue:23](C:/awesome-lostsky/frontend/apps/weibo/src/views/AccountsView.vue:23)

**原文**：登录凭据在开发阶段明文保存，但不会进入 API 、审计或执行日志。

**问题**：账号页介绍偏离任务；明文保存是重要现状，不能只删掉风险。

- **A**：管理已绑定账号并检查登录状态。当前登录凭据以明文保存，请确认后再绑定。
- **B**：绑定或解绑微博账号，查看其可用状态。当前凭据仍采用明文存储。
- **C**：查看微博账号及登录状态。注意：当前登录凭据以明文保存，但不会显示在接口返回或日志中。

#### C073

**页面**：[https://demo.weibo.lostsky.work/accounts](https://demo.weibo.lostsky.work/accounts)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/accounts](https://demo.weibo.lostsky.work/personal/accounts)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**出现条件**：账号列表为空时出现。

**源码**：[frontend/apps/weibo/src/views/AccountsView.vue:23](C:/awesome-lostsky/frontend/apps/weibo/src/views/AccountsView.vue:23)

**原文**：绑定后可以先做无副作用的登录态检查。

**问题**：“无副作用/登录态”工程语言。

- **A**：绑定账号后，可检查其是否仍处于登录状态。
- **B**：先绑定微博账号，再检查账号是否可用。
- **C**：账号绑定后，可检查登录状态；检查不会发帖或互动。

#### C074

**页面**：[https://demo.weibo.lostsky.work/compose](https://demo.weibo.lostsky.work/compose)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/compose](https://demo.weibo.lostsky.work/personal/compose)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/OperationView.vue:63](C:/awesome-lostsky/frontend/apps/weibo/src/views/OperationView.vue:63)

**原文**：首版仅支持超话帖，最多 9 张图片。图片上传后的 pid 可跨账号复用。

**问题**：首版过时、pid 泄露。

- **A**：向指定超话发布微博，最多添加 9 张图片。
- **B**：选择账号，填写超话内容并添加最多 9 张图片。
- **C**：发布超话微博，已上传的图片可供不同账号使用。

#### C075

**页面**：[https://demo.weibo.lostsky.work/compose](https://demo.weibo.lostsky.work/compose)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/compose](https://demo.weibo.lostsky.work/personal/compose)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/OperationView.vue:65](C:/awesome-lostsky/frontend/apps/weibo/src/views/OperationView.vue:65)

**原文**：选择本次远端操作使用的已绑定账号。

**问题**：“远端操作”无关。

- **A**：选择本次发帖使用的微博账号。
- **B**：从已绑定账号中选择发帖账号。
- **C**：请确认要使用哪个微博账号发布。

#### C076

**页面**：[https://demo.weibo.lostsky.work/compose](https://demo.weibo.lostsky.work/compose)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/compose](https://demo.weibo.lostsky.work/personal/compose)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/OperationView.vue:71](C:/awesome-lostsky/frontend/apps/weibo/src/views/OperationView.vue:71)

**原文**：填写超话和正文；首版只支持发布到超话。

**问题**：“首版”开发进度与用户任务无关。

- **A**：填写目标超话和微博正文。
- **B**：选择要发布的超话，再填写内容。
- **C**：本页用于发布超话微博，请填写超话名称与正文。

#### C077

**页面**：[https://demo.weibo.lostsky.work/compose](https://demo.weibo.lostsky.work/compose)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/compose](https://demo.weibo.lostsky.work/personal/compose)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/OperationView.vue:79](C:/awesome-lostsky/frontend/apps/weibo/src/views/OperationView.vue:79)

**原文**：每条最多 9 张；上传后的 pid 可跨账号复用，原文件不持久化。

**问题**：pid、持久化工程化。

- **A**：最多添加 9 张图片，上传后可供不同账号发帖使用。
- **B**：选择本次要发布的图片，最多 9 张。
- **C**：已上传图片可重复选用，每条微博最多添加 9 张。

#### C078

**页面**：[https://demo.weibo.lostsky.work/compose](https://demo.weibo.lostsky.work/compose)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/compose](https://demo.weibo.lostsky.work/personal/compose)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/OperationView.vue:83](C:/awesome-lostsky/frontend/apps/weibo/src/views/OperationView.vue:83)

**原文**：点击后最多发出一个远端写请求；失败不会自动重试。

**问题**：远端写请求不面向用户。

- **A**：确认后发布一次，失败不会自动重试。
- **B**：请核对账号和内容后发布；失败需手动处理。
- **C**：每次确认只执行一次发布，失败后不会自动重复发送。

#### C079

**页面**：[https://demo.weibo.lostsky.work/compose](https://demo.weibo.lostsky.work/compose)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/compose](https://demo.weibo.lostsky.work/personal/compose)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/components/MediaPreparation.vue:73](C:/awesome-lostsky/frontend/apps/weibo/src/components/MediaPreparation.vue:73)

**原文**：选择后立即逐张上传，无需 Weibo Ability。

**问题**：英文与能力鉴权无关。

- **A**：选择图片后立即上传，可供后续发帖使用。
- **B**：图片会逐张上传，完成后可加入微博内容。
- **C**：添加图片后将自动上传，请等待上传完成。

#### C080

**页面**：[https://demo.weibo.lostsky.work/logs](https://demo.weibo.lostsky.work/logs)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/logs](https://demo.weibo.lostsky.work/personal/logs)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/LogsView.vue:14](C:/awesome-lostsky/frontend/apps/weibo/src/views/LogsView.vue:14)

**原文**：只保留最近 30 天的最小结构化结果：HTTP 状态、微博 code/message、归一化原因和远程 ID。不保存完整响应或凭据。

**问题**：工程字段充斥功能介绍。

- **A**：查看最近 30 天的执行状态、失败原因和微博返回结果；日志不包含登录凭据。
- **B**：查询近 30 天的微博操作记录，了解结果与异常原因。
- **C**：回看最近 30 天的执行结果，按记录排查失败或未确认事项。

#### C081

**页面**：[https://demo.weibo.lostsky.work/tasks/new](https://demo.weibo.lostsky.work/tasks/new)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/tasks/new](https://demo.weibo.lostsky.work/personal/tasks/new)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/TaskFormView.vue:100](C:/awesome-lostsky/frontend/apps/weibo/src/views/TaskFormView.vue:100)

**原文**：保存和编辑不需要 Ability。每次编辑都会使旧队列消息失效，并把任务重置为暂停。

**问题**：队列和 Ability 实现泄露；暂停后需手动开启是重要后果。

- **A**：任务保存后会暂停，请确认配置后手动开启。
- **B**：修改任务后，原执行安排会停止，需要重新开启任务。
- **C**：可先保存任务配置；每次修改都会暂停任务，开启后才继续执行。

#### C082

**页面**：[https://demo.weibo.lostsky.work/tasks](https://demo.weibo.lostsky.work/tasks)
**查看方式**：从列表打开实际任务；原文仅在编辑既有任务且读取受限时出现。

**源码**：[frontend/apps/weibo/src/views/TaskFormView.vue:106](C:/awesome-lostsky/frontend/apps/weibo/src/views/TaskFormView.vue:106)

**原文**：页面结构保持可用；无法读取的已保存配置使用横杠表示。

**问题**：页面架构解释，无实际任务指导。

- **A**：当前无法读取任务配置。
- **B**：暂无可显示的已保存配置。
- **C**：任务配置暂不可用，请确认当前身份的访问权限。

#### C083

**页面**：[https://demo.weibo.lostsky.work/tasks](https://demo.weibo.lostsky.work/tasks)
**查看方式**：页面加载后可查看该介绍。

**页面**：[https://demo.weibo.lostsky.work/personal/tasks](https://demo.weibo.lostsky.work/personal/tasks)
**查看方式**：个人工作台复用该页面介绍，使用 demo 团队内当前身份。

**源码**：[frontend/apps/weibo/src/views/TasksView.vue:44](C:/awesome-lostsky/frontend/apps/weibo/src/views/TasksView.vue:44)

**原文**：首次在开始时间执行；后续时间为上次完成时间加随机间隔。阻塞解除后不会自动恢复。

**问题**：现有任务还含每日签到，统一随机间隔介绍不准确。

- **A**：管理超话发帖和每日签到任务；任务受阻后需手动恢复。
- **B**：查看自动任务的安排与状态，处理受阻任务后手动恢复。
- **C**：配置自动发帖或每日签到，并跟进每次执行结果。

### 平台

#### C084

**页面**：[https://admin.lostsky.work/administrators](https://admin.lostsky.work/administrators)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/AdministratorsView.vue:41](C:/awesome-lostsky/frontend/apps/admin/src/views/AdministratorsView.vue:41)

**原文**：管理员权限（Permission）来自平台角色并集；超级管理员拥有全部平台权限。

**问题**：英文及“并集”数学式表达。

- **A**：管理员可使用其全部角色授予的权限；超级管理员拥有所有平台权限。
- **B**：通过平台角色为管理员授权，多个角色的权限会合并生效。
- **C**：管理平台管理员的角色与权限；超级管理员可执行全部平台操作。

#### C085

**页面**：[https://admin.lostsky.work/roles](https://admin.lostsky.work/roles)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/RolesView.vue:25](C:/awesome-lostsky/frontend/apps/admin/src/views/RolesView.vue:25)

**原文**：权限（Permission）目录由代码维护；自定义角色组合固定权限后分配给平台管理员。

**问题**：代码维护与用户任务无关。

- **A**：组合平台权限建立角色，再分配给管理员。
- **B**：管理平台角色，按职责设置管理员权限。
- **C**：为不同管理职责创建角色，并配置可执行的操作。

#### C086

**页面**：[https://admin.lostsky.work/roles/new](https://admin.lostsky.work/roles/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/RoleFormView.vue:43](C:/awesome-lostsky/frontend/apps/admin/src/views/RoleFormView.vue:43)

**原文**：角色标识创建后不可修改；系统角色始终拥有固定的平台权限（Permission）。

**问题**：英文。

- **A**：角色标识创建后不可修改；系统角色的权限固定。
- **B**：设置角色名称与权限，创建后角色标识不可更改。
- **C**：维护平台角色；角色标识不可修改，系统角色权限不能调整。

#### C087

**页面**：[https://admin.lostsky.work/users](https://admin.lostsky.work/users)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/UsersView.vue:49](C:/awesome-lostsky/frontend/apps/admin/src/views/UsersView.vue:49)

**原文**：查询平台账号、会话与团队归属；敏感联系方式按当前角色权限（Permission）展示。

**问题**：英文。

- **A**：查询平台账号、登录设备和所属团队；联系方式按当前权限展示。
- **B**：查看用户账号、会话与团队关系，敏感信息仅向有权限的管理员显示。
- **C**：查找平台用户，并核对账号、设备和团队归属。

#### C088

**页面**：[https://admin.lostsky.work/teams](https://admin.lostsky.work/teams)
**查看方式**：在团队列表查找 demo，打开真实团队详情；不能将 demo 当作数字团队 ID 填入详情路径。

**源码**：[frontend/apps/admin/src/views/TeamDetailView.vue:44](C:/awesome-lostsky/frontend/apps/admin/src/views/TeamDetailView.vue:44)

**原文**：查看平台层面的团队状态、域名和能力（Ability），不进入团队内部修改内容。

**问题**：英文、实现边界抢占介绍。

- **A**：查看团队状态、访问域名与已开通能力。
- **B**：核对团队信息，并管理平台层面的状态与能力授权。
- **C**：查看团队的运行状态、域名及能力配置。

#### C089

**页面**：[https://admin.lostsky.work/entitlements/team-abilities?team=demo](https://admin.lostsky.work/entitlements/team-abilities?team=demo)
**查看方式**：已按页面支持的 team 参数预填 demo；只查看，不提交能力授权。

**源码**：[frontend/apps/admin/src/views/TeamAbilityGrantView.vue:88](C:/awesome-lostsky/frontend/apps/admin/src/views/TeamAbilityGrantView.vue:88)

**原文**：输入准确的团队 slug 后配置 Ability；无需读取平台团队目录。

**问题**：英文与权限架构无关。

- **A**：输入团队标识，为该团队开通或调整能力。
- **B**：按团队标识查找授权对象，设置能力等级与有效期。
- **C**：核对团队标识后，为团队配置能力授权。

#### C090

**页面**：[https://admin.lostsky.work/entitlements/team-abilities?team=demo](https://admin.lostsky.work/entitlements/team-abilities?team=demo)
**查看方式**：已按页面支持的 team 参数预填 demo；只查看，不提交能力授权。

**源码**：[frontend/apps/admin/src/views/TeamAbilityGrantView.vue:95](C:/awesome-lostsky/frontend/apps/admin/src/views/TeamAbilityGrantView.vue:95)

**原文**：请核对 slug。提交会替换该团队相同 Ability 的旧手工授权，但不会修改团队角色 Permission 或撤销体验活动授权。

**问题**：需保留替换后果，以中文说明。

- **A**：请核对团队标识。本次提交会替换同一能力的旧手动授权，不影响角色权限或活动授权。
- **B**：保存后，相同能力的手动授权将更新；团队角色和体验活动授权保持不变。
- **C**：确认团队后提交：仅替换该能力的手动授权，不变更角色权限或已领取的活动权益。

#### C091

**页面**：[https://admin.lostsky.work/entitlements/packages](https://admin.lostsky.work/entitlements/packages)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/EntitlementPackagesView.vue:50](C:/awesome-lostsky/frontend/apps/admin/src/views/EntitlementPackagesView.vue:50)

**原文**：平台权益包只组合代码目录中的 Ability、等级和持续天数。

**问题**：代码目录无关、Ability 混英文。

- **A**：选择团队能力，并组合其等级和有效天数。
- **B**：配置可发放给团队的能力权益包。
- **C**：将所需能力、等级和有效期组合为平台权益包。

#### C092

**页面**：[https://admin.lostsky.work/entitlements/packages/new](https://admin.lostsky.work/entitlements/packages/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/EntitlementPackageFormView.vue:113](C:/awesome-lostsky/frontend/apps/admin/src/views/EntitlementPackageFormView.vue:113)

**原文**：Ability 只能从代码目录选择；免费一个月默认填写 30 天。

**问题**：实现细节、免费一个月突兀。

- **A**：选择要提供的团队能力，并设置等级与有效天数。
- **B**：配置权益包中的能力项目；有效期按天数填写。
- **C**：为每项团队能力设置等级和有效期，30 天请填写 30。

#### C093

**页面**：[https://admin.lostsky.work/entitlements/campaigns/new](https://admin.lostsky.work/entitlements/campaigns/new)
**查看方式**：页面加载后可查看该介绍。

**源码**：[frontend/apps/admin/src/views/EntitlementCampaignView.vue:169](C:/awesome-lostsky/frontend/apps/admin/src/views/EntitlementCampaignView.vue:169)

**原文**：公共活动码使用共享代码，但同一个 Team 在相同领取组中只能成功一次。

**问题**：共享代码、Team 难懂。

- **A**：同一活动码可供多个团队使用，但每个团队在同一领取组内只能领取一次。
- **B**：公共兑换码可重复分享；同一团队不能重复领取同组权益。
- **C**：设置公共兑换活动，同一团队在相同领取组内限领一次。

#### C094

**页面**：[https://admin.lostsky.work/entitlements/campaigns](https://admin.lostsky.work/entitlements/campaigns)
**查看方式**：页面加载后可查看该介绍。

**出现条件**：活动列表为空时出现。

**源码**：[frontend/apps/admin/src/views/EntitlementCampaignsView.vue:73](C:/awesome-lostsky/frontend/apps/admin/src/views/EntitlementCampaignsView.vue:73)

**原文**：先创建 Ability 权益包，再建立公共体验活动。

**问题**：英文。

- **A**：先创建团队能力权益包，再配置公共体验活动。
- **B**：准备能力权益包后，即可创建体验活动。
- **C**：请先配置可发放的团队能力，再建立活动。

### 服务端下发

#### C095

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“人员”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:11](C:/awesome-lostsky/config/teamsetting.php:11)

**原文**：控制团队和成员是否可以通过对象标识被搜索。

**问题**：“对象”与前端人员术语不一致，保留精确标识搜索边界。

- **A**：设置已登录用户能否通过全局标识找到团队与成员。
- **B**：管理团队与成员的标识搜索范围。
- **C**：控制团队和成员是否允许被全局标识搜索找到。

#### C096

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“成员”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:43](C:/awesome-lostsky/config/teamsetting.php:43)

**原文**：配置成员离队、复职与非正常状态人员的处理方式。

**问题**：非正常状态过于含糊。

- **A**：设置成员离队、复职，以及封禁或离队后的代管规则。
- **B**：管理成员离队与复职流程，并设置停用身份的代管方式。
- **C**：配置成员离队审核、复职资料和封禁或离队后的代管权限。

#### C097

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“成员”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:56](C:/awesome-lostsky/config/teamsetting.php:56)

**原文**：封禁或离队后仍可代管人员

**问题**：“代管人员”歧义，需明确代用身份而非资料管理。

- **A**：允许代用已封禁或离队成员的身份
- **B**：封禁或离队后允许授权人员代为操作
- **C**：允许授权人员继续使用已停用的成员身份

#### C098

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“成员”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:57](C:/awesome-lostsky/config/teamsetting.php:57)

**原文**：开启后，有代入权限的人员仍可以进入并使用其完整业务能力；成员本人始终无法直接登录。

**问题**：“其”不明确，应连同开关条件保留完整边界。

- **A**：开启后，获准代用身份的人员可继续使用已封禁或离队成员的完整业务功能；成员本人仍不能直接登录。
- **B**：允许有身份代入权限的人员代为操作被封禁或已离队成员的完整业务；不会恢复成员本人的登录资格。
- **C**：即使成员已被封禁或离队，获授权人员仍可使用该身份的完整业务功能；成员本人无法直接登录。

#### C099

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“商城”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:124](C:/awesome-lostsky/config/teamsetting.php:124)

**原文**：控制公开商城开放状态，以及商城订单与其他应用之间的自动联动。

**问题**：“其他应用自动联动”含糊，实际该组是订单/权益同步记账。

- **A**：设置商城是否开放，以及订单和手动下发权益是否同步记账。
- **B**：管理商城开放状态与流水同步规则。
- **C**：配置顾客商城入口，并设置下单或下发权益时的自动记账方式。

#### C100

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“商城”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:138](C:/awesome-lostsky/config/teamsetting.php:138)

**原文**：下单时自动生成关联流水；仅在团队已开通且未过期的 Transaction Ability 时生效。

**问题**：英文能力标识泄露。

- **A**：下单时自动生成关联流水；需团队已开通且仍在有效期内的流水能力。
- **B**：团队的流水能力有效时，下单会自动生成对应记账记录。
- **C**：为订单自动记账，仅在流水能力已开通且未过期时生效。

#### C101

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“服务”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:156](C:/awesome-lostsky/config/teamsetting.php:156)

**原文**：配置新服务、权益额度、公开接单与费用调整使用的团队默认值；单个服务或权益包可以覆盖。

**问题**：密集且旧服务/权益包术语，应保留可单独覆盖。

- **A**：设置核销与权益业务的默认规则，具体服务或权益配置可单独调整。
- **B**：配置计量、额度、公开接单和费用分成的默认值；具体业务可另行设置。
- **C**：为服务和权益设置常用默认值，创建时可按实际业务调整。

#### C102

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“服务”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:177](C:/awesome-lostsky/config/teamsetting.php:177)

**原文**：允许 Customer 公开召唤接单人

**问题**：英文，召唤不如产品现有公开接单明确。

- **A**：允许顾客发布公开接单任务
- **B**：允许顾客不指定接单人发起任务
- **C**：开放顾客公开接单

#### C103

**页面**：[https://demo.team.lostsky.work/settings](https://demo.team.lostsky.work/settings)
**查看方式**：页面加载设置结构后，滚动到“服务”分组；原文由服务端下发。

**源码**：[config/teamsetting.php:177](C:/awesome-lostsky/config/teamsetting.php:177)

**原文**：开启后，Customer 可不指定具体接单人，把已填写完整的履约任务公开给该服务接单池。

**问题**：Customer 泄露，保留仅服务接单池边界。

- **A**：开启后，顾客可不指定接单人，将填写完整的任务开放给该服务的接单池。
- **B**：允许顾客填写任务资料后，交由该服务接单池中的人员领取。
- **C**：顾客可提交已填写完整的公开任务，由符合该服务接单范围的人员领取。

## 3. 本次范围与核对结果

- 仅保留账号身份、团队管理、商品管理、记账、微博、平台管理，以及团队设置中实际渲染的介绍。顾客购物端与其他非后台内容已移除。
- 历史未挂载页面不列入选稿。编号间断是删除条目造成的，剩余编号和原有 A/B/C 不变。
- 权限字典的独立 descriptions 文本未被当前权限页面渲染，相关候选已排除；权限页实际展示 groups/adminGroups 提供的标签，不能把字典说明误写为页面可见原文。
- 校验：101 组均具备原文、源码位置、A/B/C 及可点击页面网址；需要记录或特殊状态的条目另有查看方式。4 个概览列表各有 10 条候选与页面链接。
- 本次只更新本文，没有更改产品源码、业务记录、配置或人工文档；未执行构建，也未重新生成组件预览。
