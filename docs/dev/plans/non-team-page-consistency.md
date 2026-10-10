# 非 Team 页面一致性保留计划

> 状态：部分实现，暂停采纳。以下非 Team 改动尚未合并、未部署，不属于当前 Team 页面修复交付。

## 范围与保全

页面一致性审计曾扩展至全部前端应用；用户随后明确本次只处理 Team 页面。非 Team 的审计、局部实现和测试作为后续计划保留，不能因代码已写入而默认纳入当前版本。Account 与 Site 只有审计，没有应用源码修改。

原现场保留在分支 `codex/team-page-consistency`。完整工作区快照标识为 `team-page-consistency-20261009-scope-correction`；快照涵盖 74 个文件，校验结果 `matched=true`。74 是整个现场的保全数量，包含 Team 与共享工作；本计划的非 Team 清单是 **32 个应用源码文件及 2 个新增测试文件**，两者不能混为一谈。原始审计矩阵、DOM 结果和定向测试日志保存在本地任务记录中，不在公开文档记录个人路径、内部地址或测试凭据。

后续采纳须重新确认范围，按[任务编排与工作区保护](../development/contributing.md)从保全分支或快照提取具体文件，检查与当时主分支的契约差异。当前计划不授权推送、部署或删除原现场。

## 按应用保留的工作

| 应用 | 已写入但暂停采纳的变化 | 验证与剩余边界 |
| --- | --- | --- |
| Admin | 角色、权益包、体验活动目录迁至 `LsResourceList` / `LsResourceRow`；社区顶级目录采用 wide；官网人员与指标重复项迁至 `LsFormList`，维持人员 20 项、指标 12 项上限；设备行支持收缩和长名称换行；角色表单、团队详情、用户详情、系统页的 14 处局部标题迁至 `LsSectionHeader`。 | 与 Transaction / Weibo 一组的 16 个定向用例已取得通过证据；未完成外围扩展后的最终完整构建。需恢复时重验共享组件及当前权限、草稿契约。 |
| Transaction | 个人流水迁至公共资源行，保留金额与详情入口；流水详情参与方网格使用零最小轨道和长文本换行，防止手机宽度下文字与相邻字段被裁切。 | 同组定向用例覆盖团队 / 个人详情、长流水、链接焦点和实际边界。两类服务详情的业务意图不同，未强行合并。 |
| Weibo | 团队 / 个人账号、任务、执行记录迁至公共连续资源行；计数摘要使用 `LsMetricGrid`；删除私有列表皮肤；读取失败与成功空集合互斥展示，动作使用公共按钮。 | 同组定向用例覆盖两种 scope、长文本、关键动作边界、键盘聚焦、503 与成功空集合。未完成最终完整构建。 |
| Display | 修复公开人员目录搜索框尺寸与布局；调整公开文档及长内容相关样式。保留公开站点阅读和品牌容量，不套用后台 wide。 | 修后 2/2 定向用例通过；其他公开阅读场景仍须与恢复时的 Markdown 组件契约共同验证。 |
| Community | 统一治理中新建 / 编辑表单的容量判定，按实际页面任务选择布局。 | 移动端用例通过；桌面用例找不到预期 form，尚未归因。不能据此宣称已通过，也不能直接判定为产品缺陷。 |
| Chat | 补初始读取失败反馈、局部紧凑状态、身份呈现与操作触控尺寸；保留沉浸式会话布局。 | 修后尚未完成运行验证。须检查列表 / 消息失败、重试路径、键盘操作以及草稿与当前会话保留。 |
| Shop | 个人订单迁公共列表；商品表单和订单候选补初始异步反馈；卡密复制补反馈与可访问名称；长卡名、权益名、额度单位布局加固；修订少量面向用户的实现术语。 | 修后尚未完成运行验证。审计 F8 的长字段裁切已在修前证实，修后待验；初始异步与后台刷新不能覆盖草稿，剪贴板拒绝须有反馈。 |
| Account / Site | 仅保留路由 / 页面审计结论。身份认证、账号入口、公开品牌布局属于具名场景。 | 没有应用源码变更；不能为统一宽度而机械迁成后台布局。 |

组件采用范围与公开页面例外以[后台组件契约](../design/admin/components.md)、[应用约定](../design/admin/applications.md)和[组件化方法](../design/admin/componentization.md)为准。本计划记录候选实现，不改变当前已采纳的设计规则。

## 共享依赖

- `LsResourceList` / `LsResourceRow` 是 Team 与若干外围目录共用的基础结构。恢复非 Team 页面时，应先核对已经采纳的公共契约，再迁移调用方；不能把旧快照中的共享文件整包覆盖回来。资源行 identity、description、metadata、status、actions 的布局必须分别验证，禁止嵌套可交互链接。
- `LsFormList.addDisabledReason` 是这批外围工作中为 Admin 官网编辑上限补充的契约，仅限制新增并给出可解释原因，排序和删除仍可用。这是 **Admin 专用需求形成的共享扩展**，不因为 Team 页面使用 `LsFormList` 就自动需要采纳。后续先确认是否保留该扩展，再接入 `SiteContentView`。
- 组件预览、目录注册、设计文档与源代码约束检查须由同一公共组件负责人整合，避免调用方和共享实现采用不同版本的契约。

## 保留文件清单

以下均为仓库相对路径；文件列在本计划中不代表已经进入当前交付。

### Admin：9 个源码文件

```text
frontend/apps/admin/src/router.ts
frontend/apps/admin/src/views/EntitlementCampaignsView.vue
frontend/apps/admin/src/views/EntitlementPackagesView.vue
frontend/apps/admin/src/views/RoleFormView.vue
frontend/apps/admin/src/views/RolesView.vue
frontend/apps/admin/src/views/SiteContentView.vue
frontend/apps/admin/src/views/SystemView.vue
frontend/apps/admin/src/views/TeamDetailView.vue
frontend/apps/admin/src/views/UserDetailView.vue
```

### Transaction：2 个源码文件

```text
frontend/apps/transaction/src/views/PersonalWorkspaceView.vue
frontend/apps/transaction/src/views/TransactionDetailView.vue
```

### Weibo：7 个源码文件

```text
frontend/apps/weibo/src/app.css
frontend/apps/weibo/src/components/AccountHealthSummary.vue
frontend/apps/weibo/src/components/OperationRecordList.vue
frontend/apps/weibo/src/components/TaskStatusSummary.vue
frontend/apps/weibo/src/views/AccountsView.vue
frontend/apps/weibo/src/views/LogsView.vue
frontend/apps/weibo/src/views/TasksView.vue
```

### Chat：2 个源码文件

```text
frontend/apps/chat/src/views/ChatView.vue
frontend/apps/chat/src/views/NewConversationView.vue
```

### Community：2 个源码文件

```text
frontend/apps/community/src/App.vue
frontend/apps/community/src/router.ts
```

### Display：3 个源码文件

```text
frontend/apps/display/src/app.css
frontend/apps/display/src/views/DocumentView.vue
frontend/apps/display/src/views/EntitiesView.vue
```

### Shop：7 个源码文件

```text
frontend/apps/shop/src/views/CardsView.vue
frontend/apps/shop/src/views/CustomerProfileView.vue
frontend/apps/shop/src/views/ServiceView.vue
frontend/apps/shop/src/views/ServicesView.vue
frontend/apps/shop/src/views/manage/OrderFormView.vue
frontend/apps/shop/src/views/manage/PersonalOrdersView.vue
frontend/apps/shop/src/views/manage/ProductFormView.vue
```

### 新增测试：2 个文件

```text
tests/all-pages-workspaces.spec.ts
tests/all-pages-public.spec.ts
```

`all-pages-workspaces.spec.ts` 的 16 个独立用例覆盖四组场景与 1440、720、375、320 CSS 像素宽度。720 是 1440 浏览器在 200% 缩放下的等价重排宽度检查，不是操纵真实浏览器缩放的证据。通过记录采用未变化用例的有效结果与失败修复后的定向复测组合，不表示最终重新执行过一次完整集合。

`all-pages-public.spec.ts` 的状态按上表区分；未完成和失败场景必须继续保留，不能以已编写测试文件代替实际通过。

## 已知失败与证据边界

1. Admin 设备行初次修复只处理 flex 子项，375 / 320 下仍被父级 grid 的最小内容轨道撑宽；补零最小轨道后复测通过。验收必须检查关键文字、状态、动作的实际边界，单纯 `scrollWidth <= clientWidth` 无法发现外层裁切。
2. 局部标题回归曾对整个 document 断言只有一个 h1，碰到既有工作区顶栏与页面标题的双 h1。测试后来明确为页面标题与局部 section 层级；共享壳层的语义问题单独记录，没有用局部修复暗中改变全站标题。
3. 全路由审计中的社区列表返回形状、个人流水和任务详情等 fixture 缺口已另行补齐复测；不能将测试数据错误记为产品缺陷。Community 桌面 form 定位失败仍未归因，须单独排查 fixture、等待条件与页面实际结构。
4. Shop F8 修前长字段裁切已有证据，修后尚未验证；Chat / Shop 新状态分支与动作回归未完成。没有后端权限或业务数据缺陷的确认结论。
5. 首批 10 应用完整构建发生在外围扩展之前，**不能作为这 32 个外围源码文件最终构建通过的证据**。外围实现尚缺完整类型检查、最终构建和交叉审查闭环，更不代表线上验收。

## 后续最小步骤与验收

1. 重新确认需要采纳的应用和页面，从保全分支 / 快照提取相应源码与测试；保持 Team 当前交付隔离，保留未采纳工作。
2. 先核对 `LsResourceList` / `LsResourceRow` 当前契约及 Admin 是否需要 `addDisabledReason`，再检查旧候选代码与当前主分支的权限、异步和草稿逻辑差异。
3. 优先定位 Community 桌面失败，再完成 Chat / Shop 修后验证：首次 pending / error、成功空集合、刷新失败保留草稿、剪贴板成功 / 拒绝、长字段、关键操作可见且可键盘到达。不得真实发送聊天消息、扣款或操作外部微博来代替本地 fixture 验证。
4. 对选定范围运行最小受影响回归；桌面与手机均验证，长内容加 320 宽度及 200% 重排。公开阅读、品牌、聊天与商城保持各自任务布局，不把所有容量改成 wide。
5. 完成交叉审查、相关组件真实预览、类型检查、[前端约定](../development/frontend.md)要求的完整静态发布构建；新增导航还须按[文档维护规则](../development/wiki.md)验证文档构建。将具体命令、源码基线、通过项与未覆盖项一起记录。
6. 只有上述验收完成后才决定合并；部署仍按独立授权处理。采纳后把稳定规则归入对应开发正文，收敛本计划中的已完成部分；未经采纳的清单继续明确保留状态。
