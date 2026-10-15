# 对象目录

适用于 Team `/customers`、`/members`、`/docs` 与 Shop `/manage/products`、`/manage/personal/products`。目标是找到对象，再进入单对象任务。通知、设置继续采用原分类工作区；本契约不意味着其他列表都应迁移。

## 组合契约

| 组件 | 参数与插槽 | 职责 |
| --- | --- | --- |
| `LsObjectDirectory` | `title`、`description`；`actions`、`toolbar`、默认、`pagination` | 复用 `LsCollectionPage`，内容上限 64rem；页头间距 24px，工具栏到结果 16px；不接管数据或路由。 |
| `LsDirectoryIdentity` | `type`、`name`、`slug`、`imageUrl`；`status`、`context` | 目录中的两行身份：头像、名称及状态在前，类型、标识与关系摘要随后。用于资源行主链接内，不自行创建链接或命令。 |
| `LsDirectoryActions` | 对象专属可访问 `label`；`actions` 含 key/label/disabled/reason/danger/icon；`select(key)` | 全尺寸使用“更多”菜单，避免重复业务按钮占据目录。受限但有 reason 的命令可聚焦并解释原因，不发出 select。 |

搜索与筛选使用 `LsListToolbar embedded`；加载、空与失败仍在正文保留原反馈组件。连续对象行使用 `LsResourceList` / `LsResourceRow`，无单行厚卡片。页头导航用 `LsPageLink`；无业务依据不添加创建入口。无任意视觉 props、样式透传、CSS 穿透或路由 meta 改动。

成员的主链接进入档案，管理入口独立，聊天、封禁/解封和离职位于更多菜单；文档标题进入阅读，编辑入口独立，删除位于更多菜单；商品标题进入原编辑路径，类型与接单信息在第二行、售价为次要信息。顾客余额和日期为次要信息。状态紧邻名称，禁用原因不删除，危险命令保留原确认。

## 适配与状态

窄屏搜索独占一行，筛选自然换行；资源行沿用自身容器断点将次要内容与操作移到下一行。名称、标识和关系文本自然换行，不写死高度；图标不承载唯一语义。主链接保持键盘焦点，菜单提供对象专属名称与至少 44px 触控区。无新增动效或背景，继续使用现有主题材质及减少动态策略。

权限、个人/团队范围、搜索参数、分页重置和所有请求由原页面负责。成员原接口无分页，目录不新增伪分页。受限读取使用原 `LsEmptyState` 来源，错误与加载使用原 `LsAsyncState`；各状态不移除页头与工具区。

唯一具名替代为目录身份：`LsDirectoryIdentity` 负责上述两类目录身份，允许其进入 `LsResourceRow.identity`，以满足长名称换行；其他页面的 `LsEntityIdentity` 外观不变。

## 集中验收

由主对话执行：权限和 own/all/personal 范围、筛选及分页回到第一页、原导航参数、菜单命令与受限原因、危险操作确认、加载/失败/空态，及 320px、390px、1024px、1440px、200% 文本的几何检查。组件预览只作为人类附件，不能代替验收。迁移记录见[顾客目录样板与扩展](../../plans/customer-directory-pilot.md)。
