# 专注编辑剩余路由：Community 发布与编辑

## 目标关联与当前未完成页面

关联本对话活动目标“补齐专注编辑遗漏并完成 Community 发布/编辑帖子独立页面”。2026-10-18 主对话下发的明确剩余清单取代此前 24 个后台 view 的核对范围。目标工具不能修改正文，因此本文件持续维护逐路由状态，不通过虚假完成旧目标来更换目标。

当前未完成页面：

- Community `/c/:slug/posts/new`：正文版型已实施；极光场景、主题与 Header 接入未完成，受阻于中央独占 App/Shell/router 的文件边界。
- Community `/c/:slug/posts/:postId(\d+)/edit`：正文版型已实施；同一外壳接入未完成，归中央整合。

上述依赖移交不等于页面整体完成。未执行测试或验收，最终批阅仍待用户。其余后台编辑页面本轮不重复改造；Team/Admin CommunitiesView 由第一模板独占，阅读/治理归第五模板。

## 实际路由 → 模板 → 源码 → 状态

| 应用 | router 路径 | 模板 | 源码 | 正文实施 | 整体状态 |
| --- | --- | --- | --- | --- | --- |
| Community | `/c/:slug/posts/new` | LsFormPage | `frontend/apps/community/src/views/PostFormView.vue` | 已完成，待批阅 | 受阻：中央外壳场景接入未完成 |
| Community | `/c/:slug/posts/:postId(\d+)/edit` | LsFormPage | `frontend/apps/community/src/views/PostFormView.vue` | 已完成，待批阅 | 受阻：中央外壳场景接入未完成 |

状态词：未开始／进行中／已完成／受阻（原因）。已完成仅指该列源码实施，不代表测试、验收或发布通过。对应 router.ts 中数字约束以字符串转义写作 `\\d+`。

## 独立文件与版型证据

当前 `frontend/apps/community/src/router.ts` 两条路由仅导入 PostFormView。阅读导入 PostView，治理导入 ManageView；没有共用阅读/治理 Vue，因此本对话可以修改，不需要移交第五模板编辑该文件。

旧版为独立 PageHeader 加未分轨的连续字段。新版由 LsFormPage 持有页头、辅助入口与正文间距；LsFormFields 将板块与标题编排为既有横向字段；LsFormContent 明确退出横向字段上下文，使长正文编辑器占完整内容宽度。原有 App 的 form 档居中限宽保持不变，不添加重复限宽或右侧无依据摘要。页头返回与底部取消使用既有轻入口，底部仍只有一个业务提交动作。

复用 LsFormSection 的透光表面能力；实际 Community App 当前仍为普通主题，不能声称已经呈现极光。页面不复制 scene/theme，不增加共享组件视觉参数，不穿透内部类名，仅自持 form 的外部栅格间距。

## 动态分支与业务边界

| 路由/分支 | 实施状态 | 保留内容 |
| --- | --- | --- |
| 发布：只有一个启用板块 | 已完成正文接入 | 原 watcher 自动选板块，未改变 |
| 发布：多个板块或没有可用板块 | 已完成正文接入 | 原选项与提交原因，未改变 |
| 编辑：原板块已停用 | 已完成正文接入 | 保留原板块选项，选择器仍禁用 |
| 编辑：无 can_edit | 已完成正文接入 | 原作者权限原因与禁用解释 |
| 两路由：未加入、无身份、禁言、社区暂停 | 已完成正文接入 | 原 CommunityParticipation 及 interactionReason |
| 两路由：加载、首次失败、脏草稿刷新失败 | 已完成正文接入 | 原状态分支保留在模板正文中 |
| 两路由：有修改、保存中、保存期间继续编辑 | 已完成正文接入 | 原 useQueryDraft、捕获快照、accept 和离开守卫未修改 |
| 两路由：Markdown 图片上传 | 已完成正文接入 | 原上传回调及 expected entity 语义未修改 |

本表是源码实施记录，未执行这些状态的行为验收。没有调用真实保存、加入、上传或其他后端写入。

## 中央接入需求（仍未完成）

只对以上两个编辑路由接入既有场景、workspaceSceneProviderProps 与 Header 场景层级，并保持编辑器 form 档居中布局。App/Shell/router 均不在本次写入范围；不得借此对 Community 阅读、治理或其他路由无差别开启主题。无需新增公共模板。

## 预览与 Git 交付

- 基线 main：`3397e3ae2c1d579c775a1fe39964e3c77be45e65`。
- 分支：`codex/focused-editor-community`；独立 worktree 名 `focused-editor-community`，旧 focused-product-editor 工作区保持原样。
- 仅修改 PostFormView.vue 与本专属任务清单；不修改公共 UI、外壳、路由、总覆盖清单、人工文档、后端或接口。
- 代表预览使用真实 Community App、路由与组件，API 全部为模拟，只允许本机页面和模拟 GET。脚本与图片保留在忽略提交的 `test-results/community-editor/`。图中明确注明外壳待中央接入，不把普通主题预览冒充完整极光成品。
- 本人执行，无子代理；不运行测试、验收、typecheck 或完整构建。组件预览只供人类，不读取 PNG。
- 本地提交等待批阅；不合 main、不推送、不部署、不更新公共 demo、不删除环境。生命周期：正文已完成但等待审查；上述两路由整体仍有中央接入待办，活动目标不标记完成。
