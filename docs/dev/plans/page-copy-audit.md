# 后台介绍文案修订 · demo 团队

更新日期：2026-10-03。仅保留后台可见的介绍文案；编号保持不变，删除项留号不重排。

共 **101 组文案**与 **4 组概览文案**。每组只保留页面、原文与改后；已作答的 L1–L4 与 C001–C017 填入改后，其余留空，待后续批次补写。

## 页面访问说明

- 以下网址使用 demo 的标准团队域名。账号和平台后台不绑定团队，分别使用 `account.lostsky.work` 与 `admin.lostsky.work`。
- 先[登录账号](http://account.lostsky.work/login)，再在[身份选择](http://account.lostsky.work/identity)中选择 demo 团队内可用身份。个人后台要求身份归属 demo；外部人员进入团队后台还需 demo 的角色授权。
- 平台管理页面需要有效的平台管理员角色及相应平台权限，不会因为你能管理 demo 团队就自动开放。
- 链接只提供导航，不授予权限。部分原文只在空数据、加载失败、受限状态或确认弹窗中出现，不能保证使用任意账号打开都会看到。
- 详情、编辑、充值页使用实际记录的编号或标识；不能固定直达的条目只链接到列表页。
- 已按当前 Wiki、域名生成函数和路由源码核对链接；本次未登录线上逐页验证 demo 的部署、数据或权限，链接不代表已确认线上原文与本地一致。

网址依据：[请求路由与应用解析](../architecture/routing.md)、[前端路由与页面导航](../architecture/frontend-navigation.md)、域名生成方法 `frontend/packages/shared/src/navigation.ts`。

## 1. 概览页面

### L1 · 团队 · 个人概览 /personal

**页面**：[http://demo.team.lostsky.work/personal](http://demo.team.lostsky.work/personal)

**原文**：

- 所有资料和业务范围都以当前已领取的人员为主体。
- 切换身份后，系统会重新核对人员类型、角色与有效权限。

**改后**：

- 此处是你在团队中的个人中心
- 部分内容受团队管理或需要权限

### L2 · 记账 · 个人概览 /personal

**页面**：[http://demo.transaction.lostsky.work/personal](http://demo.transaction.lostsky.work/personal)

**原文**：

- 仅统计当前身份参与的业务
- 团队管理权限不会扩大个人数据范围。

**改后**：

- 团队流水需切换至团队工作台
- 商品编辑请移步至商城工作台

### L3 · 微博 · 个人概览 /personal

**页面**：[http://demo.weibo.lostsky.work/personal](http://demo.weibo.lostsky.work/personal)

**原文**：

- 账号、任务和日志固定在当前人员范围，页面不提供跨人员筛选。
- 远端写入和任务开启/恢复会在用户提交动作时核对 Weibo Ability。

**改后**：

- 管理当前人员的微博账号与任务
- 无权限或能力时可预先配置

### L4 · 微博 · 团队概览 /overview

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：远端写入和任务开启或恢复，会在提交动作时核对 Weibo Ability。

**改后**：集中管理团队运行任务，需要购买微博能力方可使用。

## 2. 逐条文案

### 账号

#### C001

**页面**：[http://account.lostsky.work/identity](http://account.lostsky.work/identity)

**原文**：业务操作将使用所领取人员的角色与权限（Permission）；账号和设备设置始终使用你的真实用户身份。

**改后**：业务操作使用你登录的人员。

#### C002

**页面**：[http://account.lostsky.work/identity](http://account.lostsky.work/identity)

**原文**：成员或顾客需先完成全局 slug 设置，才能作为根身份领取。

**改后**：使用该人员身份前，需要先补全其全局标识。

#### C003

**页面**：[http://account.lostsky.work/identity](http://account.lostsky.work/identity)

**原文**：先领取与你的账号直接关联的成员或顾客根身份。

**改后**：您的业务操作需要您领取人员身份。

#### C004

**页面**：[http://account.lostsky.work/identity/workspace-warning?team_slug=demo&redirect=http%3A%2F%2Fdemo.team.lostsky.work%2F](http://account.lostsky.work/identity/workspace-warning?team_slug=demo&redirect=http%3A%2F%2Fdemo.team.lostsky.work%2F)

**原文**：当前代表的是其他团队的人员。继续后，业务操作将使用目标团队授予该人员的 Permission。

**改后**：当前身份不属于目标团队；进入后仅可处理目标团队已授权的业务。

### 团队

#### C005

**页面**：[http://demo.team.lostsky.work/abilities](http://demo.team.lostsky.work/abilities)

**原文**：查看当前 Ability 等级与有效期，并在确认权益内容后兑换平台卡密。

**改后**：查看与兑换团队能力。

#### C006

**页面**：[http://demo.team.lostsky.work/abilities](http://demo.team.lostsky.work/abilities)

**原文**：先检查活动、Ability、等级和持续天数，再确认写入团队授权。

**改后**：查看兑换码对应的能力权益，确认后应用到当前团队。

#### C007

**页面**：[http://demo.team.lostsky.work/chat-virtuals](http://demo.team.lostsky.work/chat-virtuals)

**原文**：以同一套通用能力（Ability）承载人工代操作、Webhook，以及未来的 LLM 或工作流。

**改后**：为团队建立虚拟人员，分配角色后用于业务操作与外部集成。

#### C008

**页面**：[http://demo.team.lostsky.work/chat-virtuals](http://demo.team.lostsky.work/chat-virtuals)

**原文**：创建后可通过角色授予全局或指定 slug 的管理、操作与字段范围。

**改后**：请先创建虚拟人员。

#### C009

**页面**：[http://demo.team.lostsky.work/chat-virtual-new](http://demo.team.lostsky.work/chat-virtual-new)

**原文**：slug 用于 URL、权限（Permission）和集成身份；确定后不可修改或复用。

**改后**：您需要为虚拟人员设置标识。

#### C010

**页面**：[http://demo.team.lostsky.work/field-new](http://demo.team.lostsky.work/field-new)

**原文**：字段定义属于团队；值按对象类型与内部 ID 关联，不把数字 ID 暴露到权限（Permission）key。

**改后**：不同字段需要使用不同字段类型，以此更好的适配您的业务。

#### C011

**页面**：[http://demo.team.lostsky.work/fields](http://demo.team.lostsky.work/fields)

**原文**：统一定义人员、顾客和虚拟人员的团队内部业务资料；顾客公开资料仍由顾客本人维护。

**改后**：在业务流程中，创建自定义字段以为不同人员存储业务所需数据。

#### C012

**页面**：[http://demo.team.lostsky.work/fields](http://demo.team.lostsky.work/fields)

**原文**：字段值只在团队内部使用，不会自动成为公开资料。

**改后**：暂无字段，请先添加。

#### C013

**页面**：[http://demo.team.lostsky.work/roles/entities](http://demo.team.lostsky.work/roles/entities)

**原文**：按名称或全局 slug 搜索人员并授予当前团队角色。成员、顾客、团队和虚拟人员在这里使用同一套分配流程。

**改后**：人员被授予角色后，获取角色的权限，方可执行特定的业务。

#### C014

**页面**：[http://demo.team.lostsky.work/entities](http://demo.team.lostsky.work/entities)

**原文**：浏览团队、成员、顾客与虚拟人员。具有全量读取权限（Permission）时也会列出团队内隐藏人员。

**改后**：查看团队内有权查看的人员。

#### C015

**页面**：[http://demo.team.lostsky.work/members](http://demo.team.lostsky.work/members)

**原文**：浏览团队内可见成员；具有全量读取权限（Permission）时也会列出隐藏或封禁成员。

**改后**：查看团队内有权查看的成员。

#### C016

**页面**：[http://demo.team.lostsky.work/members](http://demo.team.lostsky.work/members)

**原文**：维护成员资料、对象字段、角色权限（Permission）与管理状态。

**改后**：管理当前成员个人资料。

#### C017

**页面**：[http://demo.team.lostsky.work/roles](http://demo.team.lostsky.work/roles)

**原文**：角色列表只用于查找和进入管理任务；角色资料、权限（Permission）与人员分配分别在独立页面完成。

**改后**：角色是权限的载体。

#### C018

**页面**：[http://demo.team.lostsky.work/roles/new](http://demo.team.lostsky.work/roles/new)

**原文**：先建立角色，再为它分配完成工作所需的最小权限（Permission）。

**改后**：填写角色资料并创建；创建后进入角色页面设置权限。

#### C019

**页面**：[http://demo.team.lostsky.work/roles/339](http://demo.team.lostsky.work/roles/339)

**原文**：维护角色资料与最小权限（Permission）集合。

**改后**：保存角色对外展示资料、权限等。

#### C020

**页面**：[http://demo.team.lostsky.work/roles/339](http://demo.team.lostsky.work/roles/339)

**原文**：通用 Permission 可直接授权团队范围或一类人员；保存时会移除已被覆盖的指定 slug。

**改后**：通用权限与所涵盖的专门权限相冲突，保存时会自动覆盖。

#### C021

**页面**：[http://demo.team.lostsky.work/roles/339](http://demo.team.lostsky.work/roles/339)

**原文**：父级 Permission 会覆盖当前及未来新增的同前缀子权限。只在职责边界稳定、确实需要整段授权时使用。

**改后**：高级权限会一并覆盖其前缀下的全部权限，请确认确需全部授权再勾选。

#### C022

**页面**：[http://demo.team.lostsky.work/roles/339](http://demo.team.lostsky.work/roles/339)

**原文**：以下父级 Permission 会同时覆盖当前列出的权限，以及未来新增的同前缀权限：

**改后**：以下权限会覆盖同前缀下的现有权限：

#### C023

**页面**：[http://demo.team.lostsky.work/notices/team](http://demo.team.lostsky.work/notices/team)

**原文**：查看 LostSky 发给 Team 的完整通知。

**改后**：阅读 LostSky 发给团队的通知，打开后自动标记已读。

#### C024

**页面**：[http://demo.team.lostsky.work/personal/notices](http://demo.team.lostsky.work/personal/notices)

**原文**：查看 Team 发给当前人员的完整通知。

**改后**：阅读团队发给你的完整通知，打开后自动标记已读。

#### C025

**页面**：[http://demo.team.lostsky.work/notices/send](http://demo.team.lostsky.work/notices/send)

**原文**：由有权限（Permission）的当前人员代表 Team，向同 Team 的一位人员发送单向通知。

**改后**：以团队名义向团队内的一位人员发送通知；发送后对方无法回复。

#### C026

**页面**：[http://demo.team.lostsky.work/notices/send](http://demo.team.lostsky.work/notices/send)

**原文**：可选择 Team、成员、顾客或虚拟人员；结果包含类型与全局标识，避免发给同名对象。

**改后**：在本团队的人员中选择收件人；不会发给同名对象。

#### C027

**页面**：[http://demo.team.lostsky.work/notices/send](http://demo.team.lostsky.work/notices/send)

**原文**：通知只进入所选人员的收件箱，不支持回复、抄送或会话；发送方统一显示为当前 Team。

**改后**：此为单向通知，不支持回复或会话；发送方显示为团队本身。

#### C028

**页面**：[http://demo.team.lostsky.work/notices/team](http://demo.team.lostsky.work/notices/team)

**原文**：LostSky 发给 Team 的共享通知

**改后**：LostSky 发给团队的共享通知，团队内统一查阅。

#### C029

**页面**：[http://demo.team.lostsky.work/personal/notices](http://demo.team.lostsky.work/personal/notices)

**原文**：当前人员收到的 Team 单向通知

**改后**：当前人员收到的团队通知。

#### C030

**页面**：[http://demo.team.lostsky.work/notices/team](http://demo.team.lostsky.work/notices/team)

**原文**：LostSky 发给 Team 的通知会显示在这里。

**改后**：还没有通知；LostSky 会在这里下发贵团队通知。

#### C031

**页面**：[http://demo.team.lostsky.work/personal/notices](http://demo.team.lostsky.work/personal/notices)

**原文**：Team 发给当前人员的通知会显示在这里。

**改后**：还没有通知；团队发给你后会显示在这里。

#### C032

**页面**：[http://demo.team.lostsky.work/personal](http://demo.team.lostsky.work/personal)

**原文**：只读查看角色来源与当前实际生效的 Permission。

**改后**：查看当前身份所属角色及其实际生效的权限，仅可查看、不可修改。

#### C033

**页面**：[http://demo.team.lostsky.work/personal](http://demo.team.lostsky.work/personal)

**原文**：资料、对象字段和权限（Permission）入口保持可用；重新进入页面后会再次读取当前身份。

**改后**：正在读取当前身份；各功能入口保持可用，重新进入页面后会重新读取。

#### C034

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。

**改后**：配置团队设置，以此更好的贴合贵团队的业务。

#### C035

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：应用登记团队设置后会自动显示在这里。

**改后**：还没有可配置的设置项。

#### C036

**页面**：[http://demo.team.lostsky.work/doc-create](http://demo.team.lostsky.work/doc-create)

**原文**：使用可视化编辑器整理长期知识；输入 @ 可插入团队或成员对象。

**改后**：用可视化编辑器撰写团队文档，输入 @ 可引用团队或人员。

#### C037

**页面**：[http://demo.team.lostsky.work/doc](http://demo.team.lostsky.work/doc)

**原文**：阅读团队沉淀的流程、规范与长期知识。

**改后**：浏览文档。

#### C038

**页面**：[http://demo.team.lostsky.work/doc](http://demo.team.lostsky.work/doc)

**原文**：可以进入编辑页补充内容，标题和访问规则会保持不变。

**改后**：（不改动）

#### C039

**页面**：[http://demo.team.lostsky.work/join-review](http://demo.team.lostsky.work/join-review)

**原文**：查看申请状态，选择一条申请进入独立审核页面。

**改后**：查看加入申请，点击进入对应审核页面。

#### C040

**页面**：[http://demo.team.lostsky.work/personal/access](http://demo.team.lostsky.work/personal/access)

**原文**：以下按当前团队分配角色中的权限（Permission）记录逐条展示。

**改后**：以下权限来自当前团队分配给该身份的角色。

#### C127

**页面**：[http://demo.team.lostsky.work/customers/518](http://demo.team.lostsky.work/customers/518)

**原文**：可多选；这些人员仍需具备记账 Ability 与对应 Permission，才能协作处理该顾客。

**改后**：可以选择多名协作人员；他们仍需开通记账能力并具备相应权限，才能处理该顾客的业务。

### 商品

#### C041

**页面**：[http://demo.shop.lostsky.work/manage](http://demo.shop.lostsky.work/manage)

**原文**：统一管理普通商品、核销商品、卡密和套餐，在订单中跟进交付。

**改后**：管理团队商品并跟进订单交付，覆盖普通商品、核销商品、卡密和套餐。

#### C042

**页面**：[http://demo.shop.lostsky.work/manage](http://demo.shop.lostsky.work/manage)；[http://demo.shop.lostsky.work/manage/personal](http://demo.shop.lostsky.work/manage/personal)

**原文**：选择普通商品、核销商品、卡密或套餐。

**改后**：四种商品类型：普通商品、核销商品、卡密和套餐。

#### C043

**页面**：[http://demo.shop.lostsky.work/manage/personal](http://demo.shop.lostsky.work/manage/personal)

**原文**：管理专属人员为当前身份的商品、接单人和核销字段。

**改后**：管理归属当前人员的商品，如价格和核销方式。

#### C044

**页面**：[http://demo.shop.lostsky.work/manage/personal/products](http://demo.shop.lostsky.work/manage/personal/products)

**原文**：只管理专属人员为当前身份的商品、履约方式与接单配置。

**改后**：你可维护你个人的商品。

#### C045

**页面**：[http://demo.shop.lostsky.work/manage/products/new](http://demo.shop.lostsky.work/manage/products/new)；[http://demo.shop.lostsky.work/manage/personal/products/new](http://demo.shop.lostsky.work/manage/personal/products/new)

**原文**：商品类型决定订单完成时的履约结果；服务和卡密配置由后端再次校验。

**改后**：商品类型决定订单完成时交付什么；相关配置在保存时由后端再次校验。

#### C046

**页面**：[http://demo.shop.lostsky.work/manage/orders/new](http://demo.shop.lostsky.work/manage/orders/new)

**原文**：由服务端重新读取商品并计算价格与分成；服务商品和卡商品无需选择接单人。

**改后**：分成自动根据价格计算，也可手动输入。

#### C047

**页面**：[http://demo.shop.lostsky.work/manage/personal/orders](http://demo.shop.lostsky.work/manage/personal/orders)

**原文**：仅显示当前人员作为接单人或发单人参与的订单；范围由服务端固定。

**改后**：只显示当前人员接单或发单的订单。

#### C048

**页面**：[http://demo.shop.lostsky.work/manage](http://demo.shop.lostsky.work/manage)；[http://demo.shop.lostsky.work/manage/personal](http://demo.shop.lostsky.work/manage/personal)

**原文**：从订单确认业务结果，继续处理每一份服务。

**改后**：继续跟进你的接单与接单情况。

### 记账

#### C052

**页面**：[http://demo.transaction.lostsky.work/transactions](http://demo.transaction.lostsky.work/transactions)

**原文**：通过对流水的实时查看，您可对商业状态了如指掌。

**改后**：实时查看团队流水，随时掌握收支情况。

#### C053

**页面**：[http://demo.transaction.lostsky.work/balances](http://demo.transaction.lostsky.work/balances)

**原文**：查看顾客的可用预存款、累计充值与累计消费；充值和明细使用独立任务页。

**改后**：查看每位顾客的可用余额、累计充值和累计消费；充值与明细在各自页面办理。

#### C054

**页面**：[http://demo.transaction.lostsky.work/balances](http://demo.transaction.lostsky.work/balances)

**原文**：充值成功后会增加顾客可用余额，并写入不可遗漏的余额变动记录。

**改后**：充值成功后余额立即增加，并写入一条余额变动记录。

#### C055

**页面**：[http://demo.transaction.lostsky.work/personal](http://demo.transaction.lostsky.work/personal)；[http://demo.transaction.lostsky.work/personal/transactions](http://demo.transaction.lostsky.work/personal/transactions)

**原文**：集中查看当前人员的角色笔数、月度数据与参与流水。

**改后**：汇总当前人员参与的流水与业绩。

#### C056

**页面**：[http://demo.transaction.lostsky.work/personal](http://demo.transaction.lostsky.work/personal)

**原文**：查看当前人员作为处理者参与的履约任务。

**改后**：查看你的接单情况。

#### C057

**页面**：[http://demo.transaction.lostsky.work/overview](http://demo.transaction.lostsky.work/overview)

**原文**：处理权益实例并记录核销过程。

**改后**：处理并记录顾客核销。

#### C058

**页面**：[http://demo.transaction.lostsky.work/overview](http://demo.transaction.lostsky.work/overview)

**原文**：查看余额、明细并按权限（Permission）执行充值。

**改后**：查看顾客余额和流水明细；具备权限后可为顾客充值。

#### C059

**页面**：[http://demo.transaction.lostsky.work/personal](http://demo.transaction.lostsky.work/personal)

**原文**：角色参与笔数与业绩分开呈现，月度指标按本月统计。

**改后**：按角色分别统计参与流水与业绩。

#### C060

**页面**：[http://demo.transaction.lostsky.work/personal/entitlements/new](http://demo.transaction.lostsky.work/personal/entitlements/new)

**原文**：为当前人员接待的顾客直接交付 Shop 权益套餐；本操作不创建商城订单。

**改后**：授予顾客可核销的权益，视同顾客下单核销商品；全程不产生商城订单。

#### C061

**页面**：[http://demo.transaction.lostsky.work/entitlements/new](http://demo.transaction.lostsky.work/entitlements/new)

**原文**：从 Shop 权益套餐读取权益快照并直接交付给顾客；本操作不创建商城订单。

**改后**：按权益套餐的内容把权益直接交付给顾客；不创建商城订单。

#### C062

**页面**：[http://demo.transaction.lostsky.work/personal/entitlements/new](http://demo.transaction.lostsky.work/personal/entitlements/new)；[http://demo.transaction.lostsky.work/entitlements/new](http://demo.transaction.lostsky.work/entitlements/new)

**原文**：先在 Shop 创建并启用关联权益包的权益套餐商品。

**改后**：请先在商城应用创建并启用核销商品。

#### C063

**页面**：[http://demo.transaction.lostsky.work/personal/entitlements/new](http://demo.transaction.lostsky.work/personal/entitlements/new)；[http://demo.transaction.lostsky.work/entitlements/new](http://demo.transaction.lostsky.work/entitlements/new)

**原文**：只显示 Shop 中已启用且关联有效权益包的权益套餐。

**改后**：仅列出商城中已启用、且含有核销商品的套餐商品。

### 微博

#### C064

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：把账号健康、持续任务和执行结果放在同一个运行面，先判断状态，再进入具体工作。

**改后**：在一个页面查看账号健康、任务状态和执行结果；让贵团队能够检查运行状态。

#### C065

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：账号可用性与任务状态保持并排，异常优先处理。

**改后**：账号健康和任务状态并列展示，便于优先处理异常。

#### C066

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：只收拢失败与结果未确认记录，避免正常日志干扰判断。

**改后**：只收拢失败与结果未确认记录；不显示常规运行日志。

#### C067

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：从判断切换到执行。

**改后**：状态确认完毕后，从这里进入账号、发帖、互动和任务等具体工作。

#### C068

**页面**：[http://demo.weibo.lostsky.work/personal](http://demo.weibo.lostsky.work/personal)

**原文**：查看最近 30 天的最小结构化执行结果。

**改后**：查看最近 30 天的执行结果摘要。

#### C069

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：基础概览保持可达；账号、任务、日志与业务操作需要 weibo.team.manage Permission。

**改后**：概览对所有人开放；账号、任务、日志和业务操作需要 weibo.team.manage 权限。

#### C070

**页面**：[http://demo.weibo.lostsky.work/overview](http://demo.weibo.lostsky.work/overview)

**原文**：远端写入和任务开启或恢复，会在提交动作时核对 Weibo Ability。

**改后**：真实业务会检查团队是否具备微博能力，购买能力前仍可对图文进行编辑。

#### C071

**页面**：[http://demo.weibo.lostsky.work/personal](http://demo.weibo.lostsky.work/personal)

**原文**：远端写入和任务开启/恢复会在用户提交动作时核对 Weibo Ability。

**改后**：业务操作需 weibo.personal.use 请联系管理员开通。

#### C072

**页面**：[http://demo.weibo.lostsky.work/accounts](http://demo.weibo.lostsky.work/accounts)；[http://demo.weibo.lostsky.work/personal/accounts](http://demo.weibo.lostsky.work/personal/accounts)

**原文**：登录凭据在开发阶段明文保存，但不会进入 API 、审计或执行日志。

**改后**：查看与管理所绑定微博账号。

#### C073

**页面**：[http://demo.weibo.lostsky.work/accounts](http://demo.weibo.lostsky.work/accounts)；[http://demo.weibo.lostsky.work/personal/accounts](http://demo.weibo.lostsky.work/personal/accounts)

**原文**：绑定后可以先做无副作用的登录态检查。

**改后**：绑定账号后可以先检查登录状态；这一步不会操作微博账号。

#### C074

**页面**：[http://demo.weibo.lostsky.work/compose](http://demo.weibo.lostsky.work/compose)；[http://demo.weibo.lostsky.work/personal/compose](http://demo.weibo.lostsky.work/personal/compose)

**原文**：首版仅支持超话帖，最多 9 张图片。图片上传后的 pid 可跨账号复用。

**改后**：在超话内发帖不同步至主页。

#### C075

**页面**：[http://demo.weibo.lostsky.work/compose](http://demo.weibo.lostsky.work/compose)；[http://demo.weibo.lostsky.work/personal/compose](http://demo.weibo.lostsky.work/personal/compose)

**原文**：选择本次远端操作使用的已绑定账号。

**改后**：选择本次发布使用的已绑定微博账号。

#### C076

**页面**：[http://demo.weibo.lostsky.work/compose](http://demo.weibo.lostsky.work/compose)；[http://demo.weibo.lostsky.work/personal/compose](http://demo.weibo.lostsky.work/personal/compose)

**原文**：填写超话和正文；首版只支持发布到超话。

**改后**：填写超话名词和正文。

#### C077

**页面**：[http://demo.weibo.lostsky.work/compose](http://demo.weibo.lostsky.work/compose)；[http://demo.weibo.lostsky.work/personal/compose](http://demo.weibo.lostsky.work/personal/compose)

**原文**：每条最多 9 张；上传后的 pid 可跨账号复用，原文件不持久化。

**改后**：每条帖子最多 9 张图片；不占用团队文件额度。

#### C078

**页面**：[http://demo.weibo.lostsky.work/compose](http://demo.weibo.lostsky.work/compose)；[http://demo.weibo.lostsky.work/personal/compose](http://demo.weibo.lostsky.work/personal/compose)

**原文**：点击后最多发出一个远端写请求；失败不会自动重试。

**改后**：点击发布后发出一次请求；失败后需手动重试。

#### C079

**页面**：[http://demo.weibo.lostsky.work/compose](http://demo.weibo.lostsky.work/compose)；[http://demo.weibo.lostsky.work/personal/compose](http://demo.weibo.lostsky.work/personal/compose)

**原文**：选择后立即逐张上传，无需 Weibo Ability。

**改后**：选中图片后逐张上传。

#### C080

**页面**：[http://demo.weibo.lostsky.work/logs](http://demo.weibo.lostsky.work/logs)；[http://demo.weibo.lostsky.work/personal/logs](http://demo.weibo.lostsky.work/personal/logs)

**原文**：只保留最近 30 天的最小结构化结果：HTTP 状态、微博 code/message、归一化原因和远程 ID。不保存完整响应或凭据。

**改后**：日志只保留最近 30 天：保留请求状态、微博返回码、失败原因和远端编号；其他内容不会保存。（不建议非技术人员查看）

#### C081

**页面**：[http://demo.weibo.lostsky.work/tasks/new](http://demo.weibo.lostsky.work/tasks/new)；[http://demo.weibo.lostsky.work/personal/tasks/new](http://demo.weibo.lostsky.work/personal/tasks/new)

**原文**：保存和编辑不需要 Ability。每次编辑都会使旧队列消息失效，并把任务重置为暂停。

**改后**：新建和编辑任务不需要微博能力，仅启用任务需要；修改后任务会回到暂停状态，需重新开启。

#### C082

**页面**：[http://demo.weibo.lostsky.work/tasks](http://demo.weibo.lostsky.work/tasks)

**原文**：页面结构保持可用；无法读取的已保存配置使用横杠表示。

**改后**：列表结构始终可用；暂时无法读取的配置会显示为横杠。

#### C083

**页面**：[http://demo.weibo.lostsky.work/tasks](http://demo.weibo.lostsky.work/tasks)；[http://demo.weibo.lostsky.work/personal/tasks](http://demo.weibo.lostsky.work/personal/tasks)

**原文**：首次在开始时间执行；后续时间为上次完成时间加随机间隔。阻塞解除后不会自动恢复。

**改后**：任务从设定的开始时间执行第一轮，之后在上一次完成时间上加随机间隔继续；被阻塞后不会自动恢复。

### 平台

#### C084

**页面**：[http://admin.lostsky.work/administrators](http://admin.lostsky.work/administrators)

**原文**：管理员权限（Permission）来自平台角色并集；超级管理员拥有全部平台权限。

**改后**：管理员的权限是其所有平台角色权限的并集；超级管理员拥有全部平台权限。

#### C085

**页面**：[http://admin.lostsky.work/roles](http://admin.lostsky.work/roles)

**原文**：权限（Permission）目录由代码维护；自定义角色组合固定权限后分配给平台管理员。

**改后**：可选权限由代码统一维护；自定义角色从固定权限中组合，再分配给平台管理员。

#### C086

**页面**：[http://admin.lostsky.work/roles/new](http://admin.lostsky.work/roles/new)

**原文**：角色标识创建后不可修改；系统角色始终拥有固定的平台权限（Permission）。

**改后**：角色标识保存后不能再修改；系统角色的权限固定，不可调整。

#### C087

**页面**：[http://admin.lostsky.work/users](http://admin.lostsky.work/users)

**原文**：查询平台账号、会话与团队归属；敏感联系方式按当前角色权限（Permission）展示。

**改后**：查询平台用户的会话和团队归属；手机号等敏感信息需要相应权限才能查看。

#### C088

**页面**：[http://admin.lostsky.work/teams](http://admin.lostsky.work/teams)

**原文**：查看平台层面的团队状态、域名和能力（Ability），不进入团队内部修改内容。

**改后**：查看各团队的所有者、规模和运行状态；平台只做治理，不会改动团队内部业务数据。

#### C089

**页面**：[http://admin.lostsky.work/entitlements/team-abilities?team=demo](http://admin.lostsky.work/entitlements/team-abilities?team=demo)

**原文**：输入准确的团队 slug 后配置 Ability；无需读取平台团队目录。

**改后**：直接输入团队标识来开通能力；无需从团队列表中查找。

#### C090

**页面**：[http://admin.lostsky.work/entitlements/team-abilities?team=demo](http://admin.lostsky.work/entitlements/team-abilities?team=demo)

**原文**：请核对 slug。提交会替换该团队相同 Ability 的旧手工授权，但不会修改团队角色 Permission 或撤销体验活动授权。

**改后**：提交前请再次核对团队标识；提交会覆盖该团队同一种能力的旧手工授权，但不影响角色权限和体验活动授权。

#### C091

**页面**：[http://admin.lostsky.work/entitlements/packages](http://admin.lostsky.work/entitlements/packages)

**原文**：平台权益包只组合代码目录中的 Ability、等级和持续天数。

**改后**：权益包从代码目录中的能力里选择，并设定等级和持续天数。

#### C092

**页面**：[http://admin.lostsky.work/entitlements/packages/new](http://admin.lostsky.work/entitlements/packages/new)

**原文**：Ability 只能从代码目录选择；免费一个月默认填写 30 天。

**改后**：能力只能从代码目录中选择；持续天数填 0 表示永久。

#### C093

**页面**：[http://admin.lostsky.work/entitlements/campaigns/new](http://admin.lostsky.work/entitlements/campaigns/new)

**原文**：公共活动码使用共享代码，但同一个 Team 在相同领取组中只能成功一次。

**改后**：体验码在所有团队之间共享；同一个团队在同一互斥组中只能领取一次。

#### C094

**页面**：[http://admin.lostsky.work/entitlements/campaigns](http://admin.lostsky.work/entitlements/campaigns)

**原文**：先创建 Ability 权益包，再建立公共体验活动。

**改后**：还没有体验活动；先创建权益包，再建立公共体验活动。

### 服务端下发

#### C095

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：控制团队和成员是否可以通过对象标识被搜索。

**改后**：决定团队和成员能否通过 @标识 被搜索到。

#### C096

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：配置成员离队、复职与非正常状态人员的处理方式。

**改后**：管理成员离队与入职相关设置。

#### C097

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：封禁或离队后仍可代管人员

**改后**：成员失效后允许被管理员登录

#### C098

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：开启后，有代入权限的人员仍可以进入并使用其完整业务能力；成员本人始终无法直接登录。

**改后**：开启后，有权限的人员仍可登录该成员并使用其全部业务功能；成员本人始终无法登录。

#### C099

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：控制公开商城开放状态，以及商城订单与其他应用之间的自动联动。

**改后**：控制公开商城是否开放，以及订单与记账应用之间的自动联动。

#### C100

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：下单时自动生成关联流水；仅在团队已开通且未过期的 Transaction Ability 时生效。

**改后**：下单后于记账应用自动生成对应流水；需要团队记账能力有效。

#### C101

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：配置新服务、权益额度、公开接单与费用调整使用的团队默认值；单个服务或权益包可以覆盖。

**改后**：设置核销、分成等默认数据。

#### C102

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：允许 Customer 公开召唤接单人

**改后**：允许顾客公开征集接单人

#### C103

**页面**：[http://demo.team.lostsky.work/settings](http://demo.team.lostsky.work/settings)

**原文**：开启后，Customer 可不指定具体接单人，把已填写完整的履约任务公开给该服务接单池。

**改后**：开启后，顾客无需指定接单人；核销权益时会进入公开接单池。
