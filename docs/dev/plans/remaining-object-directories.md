---
title: 剩余对象目录迁移进度
description: 本轮独立工作区的实际路由与分支实施记录。
---

# 剩余对象目录迁移进度

关联当前聊天目标：remaining-object-directories。基线 `3397e3ae2c1d579c775a1fe39964e3c77be45e65`，分支 `codex/remaining-object-directories`。

本轮本人实施，复用 `LsObjectDirectory`、连续资源行、内嵌轻工具栏与轻链接。保留接口、权限、业务和路由参数。仅修改下列页面及专属组件、本文档；不修改公共 UI、路由、全局覆盖表。用户要求不测试、不验收、不 typecheck、不构建；完成实施后本地提交等待主对话审查，不合并、不推送、不部署、不删除环境。社区列表、余额明细 `/balance` 和日志不属于本轮。

状态：未开始／进行中／已完成／受阻（原因）。已完成只表示页面实施完成，不代表测试或生产验收。共享 Vue 按实际路由分支分别记录。

| 应用 | 实际路由／分支 | 源码（frontend/apps 下） | 模板 | 状态 | 实施证据 |
| --- | --- | --- | --- | --- | --- |
| Team | `/files` | `team/src/views/FilesView.vue` | LsObjectDirectory | 已完成 | 内嵌搜索、连续文件行、更多菜单、来源与时间辅助信息 |
| Team | `/entities` | `team/src/views/EntitiesView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/chat-groups` | `team/src/views/ChatGroupsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/chat-virtuals` | `team/src/views/ChatVirtualsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/fields：entity_type=entity` | `team/src/views/EntityFieldsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/fields：entity_type=customer` | `team/src/views/EntityFieldsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/fields：entity_type=virtual` | `team/src/views/EntityFieldsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/roles` | `team/src/views/RolesView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Team | `/join-fields` | `team/src/views/JoinFieldsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Admin | `/users` | `admin/src/views/UsersView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Admin | `/teams` | `admin/src/views/TeamsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Admin | `/administrators` | `admin/src/views/AdministratorsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Admin | `/roles` | `admin/src/views/RolesView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Admin | `/entitlements/packages` | `admin/src/views/EntitlementPackagesView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Admin | `/entitlements/campaigns` | `admin/src/views/EntitlementCampaignsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/transactions` | `transaction/src/views/TransactionsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/personal/transactions` | `transaction/src/views/PersonalWorkspaceView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/personal/services：指定邀请 offers` | `transaction/src/views/PersonalWorkspaceView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/personal/services：可接单 available` | `transaction/src/views/PersonalWorkspaceView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/personal/services：履约记录 rows` | `transaction/src/views/PersonalWorkspaceView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/personal/customers` | `transaction/src/views/PersonalCustomersView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/personal/entitlements` | `transaction/src/views/PersonalEntitlementsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/services` | `transaction/src/views/ServicesView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Transaction | `/balances` | `transaction/src/views/BalancesView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Shop | `/manage/orders` | `shop/src/views/manage/OrdersView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Shop | `/manage/personal/orders` | `shop/src/views/manage/PersonalOrdersView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Weibo | `/accounts` | `weibo/src/views/AccountsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Weibo | `/personal/accounts` | `weibo/src/views/AccountsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Weibo | `/tasks` | `weibo/src/views/TasksView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Weibo | `/personal/tasks` | `weibo/src/views/TasksView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Weibo | `/interactions/comment-presets` | `weibo/src/views/CommentPresetsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Weibo | `/personal/interactions/comment-presets` | `weibo/src/views/CommentPresetsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |
| Account | `/teams` | `account/src/views/TeamsView.vue` | LsObjectDirectory | 已完成 | 居中目录＋连续资源行；保留原查询与导航 |

`/personal/bindings` 保留重定向至 `/personal/customers`，无独立列表。Team `/fields` 三类字段共享版型、独立查询参数，已逐项列出。筛选条件不新增路由。

## 交付记录

- 本地提交：本文件随本轮页面改造一同提交；最终 SHA 由聊天交付，状态为“已完成等待审查”。
- 真实预览：`frontend/component-previews/generated/LsObjectDirectory.png`（1440 × 3992）与 `PersonalServiceLists.png`（1440 × 2581），真实 Vue 与夹具渲染，生成报告 failed 为空；预览不作为测试或验收，PNG 仅供人类查看且不提交。
- 后续：主对话统一审查及验证。

## 分支与保留约束

- Team `/entities` 的全部、团队、成员、顾客、虚拟人员类型筛选共享目录行；成员仍转到 `/member-detail?id=` 或 `/member-edit?id=`，其他对象仍用 `/entity?id=`。`/fields` 创建仍携带 type，编辑仍携带 id；虚拟人员详情仍携带 slug。
- Transaction `/personal/services` 三组在专属 `transaction/src/components/PersonalServiceLists.vue` 实施，移除面板套卡和固定宽度列；邀请、公开任务、已接任务各自导航、数量精度、结算分成、资料字段、退回资格和理由原样保留。
- Transaction `/personal/transactions` 保留统计指标，记录使用整行详情入口；`/personal/customers` 和 `/personal/entitlements` 保留只读属性，不添加不存在的详情入口。
- Weibo 六条实际路由按 `route.meta.workspace`、`apiPrefix`、`expectedEntity` 或 `useCommentPresets` 继续区分个人与团队。预设评论的回跳 query 不变；任务开启／恢复仍显示 Ability 禁用原因。账号检查与解绑置于更多菜单；任务的 Checkin／自动发帖描述、Active／Paused／Blocked／Cancelled 操作分支保留。
- Account 保留一次性入队码生成、到期刷新、复制和创建团队弹窗；团队入口继续跳转团队域名。
- 公共 UI、router、shell、社区页、余额明细、日志和全局覆盖清单均未修改。

## 待主对话处理

- 实施剩余项：无；29 条实际路由及共享分支均在上表。
- 主对话负责后续统一审查、运行权限／交互／响应式验收，以及测试、typecheck 和完整构建。本轮按指令未执行这些工作，不报告为通过。
- 工作区、分支及 node_modules 依赖 junction 保留待审查；不合并、不推送、不部署。临时预览脚本位于忽略目录 `tmp/`，独立端口 5297 的预览进程已随脚本退出。
