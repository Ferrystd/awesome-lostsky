# 商品与记账主辅栏迁移

基线 `c5a15316`。本轮仅迁移后台现役独立任务页，使用 `LsFormPage` / `LsDetailPage` 的 `aside` 与 `asideLabel`，复用统一主辅轨道。表单路由提升到现有 `content` 宽度；主操作、金额校验、请求载荷、权限及草稿保存边界不变。右栏不增加接口或写动作。

## 实施与验收清单

| 源码（相对 frontend/apps） | 现役路由 | 主区组名与用户目标 | 右栏组名、内容及拆分理由 |
| --- | --- | --- | --- |
| shop/src/views/manage/ProductFormView.vue | `/manage/products/new`、`/manage/products/:id`、`/manage/personal/products/new`、`/manage/personal/products/:id` | 编辑商品：基础资料、销售履约、组合或规格、购买/核销字段、分成及统一保存 | 商品概况：草稿名称、类型、状态、归属、售价成本与团队分成；核销额度、组合数量或规格数量按类型显示。辅助核对当前商品，不复制编辑器 |
| shop/src/views/manage/OrderFormView.vue | `/manage/orders/new` | 创建订单：选择商品、数量、参与方、购买资料并提交 | 订单核对：已选商品、数量、估算总价、顾客与购买资料项数。明确估算，以服务端创建时冻结金额为准 |
| shop/src/views/manage/OrderDetailView.vue | `/manage/orders/:id` | 查看履约与分成：参与方、冻结分成、购买资料；原完成/取消保持原位置 | 订单概况：已保存状态、数量、单价、总价、支付构成、关联流水。订单背景与详细资料分离，不改变确认流程 |
| transaction/src/views/TransactionFormView.vue | `/personal/transactions/new`、`/edit?id=…` | 登记或编辑流水：参与方、支付、成本分成、时间备注与原保存 | 金额核对及顾客余额：当前草稿合计/平衡状态和已读取余额。辅助金额核对；字段旁校验保留，空值不展示有效零值 |
| transaction/src/views/RechargeView.vue | `/recharge` | 顾客充值：顾客、金额、备注与确认 | 充值核对：顾客、当前余额、本次金额、预计充值后余额。只作预览，不预先修改余额 |
| transaction/src/views/EntitlementGrantView.vue | `/entitlements/new`、`/personal/entitlements/new` | 赋予内容：商品、顾客、份数与业务归属，保留待确认重试和结果反馈 | 发放核对：草稿或待确认固定载荷、商品顾客份数、不创建订单及同步收款设置。待确认时使用 pending.payload，不能展示新的草稿代替在途操作 |
| transaction/src/views/TransactionDetailView.vue | `/detail?id=…`、`/personal/transactions/:id` | 支付构成、成本与分成：核对已保存财务结果；原编辑/删除保持原权限 | 流水概况：已保存类型、总价、时间、参与方与备注。去除原重复摘要，主区金额分解按自身可用宽度排列 |
| transaction/src/views/ServiceDetailView.vue | `/services/:id` | 履约资源、取消申请、费用调整、改派、审核：保留每项原权限和保存边界 | 任务概况：已保存顾客状态、参与方、时间、总量与资源数。摘要从主区移出；费用计算和处理动作仍在对应主区 |
| transaction/src/views/PersonalServiceTaskView.vue | `/personal/service-offers/:id`、`/personal/services/available/:id`、`/personal/services/:id` | 接单或结单：领取数量、每份顾客/接单字段、邀请或领取、结单与退回 | 任务概况：已保存顾客、接单/核销状态、数量、分成、来源与接单人。原字段列按主区容器宽度折叠，不因桌面视口大而挤压控件 |

共 9 个源码页面、17 个路由。以上均有现有数据来源，无需新增统计或接口，没有仅因实现复杂而延后的页面。

## 明确排除

- 公共商城、顾客中心、分类工作区、商品/订单/流水/权益列表、总览、统计和余额日志维持现有布局。
- 旧 `ServiceFormView`、`PackageFormView`、`CampaignFormView` 等没有现役路由，不作为当前后台页面迁移。
- `/manage/orders/new/:id` 不是现役路由；新建订单与订单详情分别由 `/manage/orders/new` 和 `/manage/orders/:id` 承载。
- 没有独立的后台权益详情路由，不凭本轮布局任务新增页面。现有权益核销与接单详情已包含在上表。

## 验收边界

- 使用模拟 API 隔离浏览器验证，覆盖所有上述路由，以及 320、375、768、1024、1440px 和 200% 根字号下的真实主辅列几何、长文字、无横向溢出。
- 重点核对流水与充值右栏输入同步、空金额、权限受限、读取失败、在途权益固定载荷；主区保存请求不得包含右栏专用字段。
- 对比现有脚本语句，已有业务语句与处理函数保持不变，仅添加只读展示计算及组件导入。完整 typecheck 与发布构建由共享负责人串行执行。
- 本文件是实施与验证清单，具体通过结果由任务交付记录说明，不以清单存在代替执行结果。
