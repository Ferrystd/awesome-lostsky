# 身份流程、会话协作与系统结果迁移

关联本聊天 active goal：完成身份流程、会话协作与系统结果专用版型。目标工具不支持修改正文；以下清单为目标的实时未完成清单，不能以共享文件或其他分支完成代替逐项状态。

基线 main 3397e3ae；分支 codex/identity-conversation-results；工作区 C:/lostsky-worktrees/identity-conversation-results。本人实施，无子代理。禁止测试、验收、typecheck、完整构建；允许真实预览。不得合并、推送、部署、删除环境。

## 路由与分支状态

| 应用 | 路由 / 动态分支 | 源码（views/） | 状态 |
| --- | --- | --- | --- |
| Account | /login：短信 | LoginView.vue | 已完成：居中流程；验证码字段与提交连续 |
| Account | /login：密码 | LoginView.vue | 已完成：居中流程；密码显示按钮独立轨道，删除输入穿透 |
| Account | /register | RegisterView.vue | 已完成：居中流程；手机验证与密码注册同一面板 |
| Account | /recovery：verify | RecoveryView.vue | 已完成：流程进度＋当前手机号核验 |
| Account | /recovery：choose | RecoveryView.vue | 已完成：恢复方式选择处于更新信息步骤 |
| Account | /recovery：password | RecoveryView.vue | 已完成：密码更新分支保留原字段和提交 |
| Account | /recovery：phone | RecoveryView.vue | 已完成：手机换绑分支保留专用发送回调 |
| Account | /recovery：done | RecoveryView.vue | 已完成：完成进度与返回登录 |
| Account | /identity：基础账号候选 | IdentityView.vue | 已完成：居中身份流程，连续候选行 |
| Account | /identity：当前身份及可切换候选 | IdentityView.vue | 已完成：当前身份、放弃与候选同一流程面板 |
| Account | /identity：target 定向候选 | IdentityView.vue | 已完成：保留目标提示及目标行选中 |
| Account | /identity/member-callback：无效地址 | MemberIdentityCallbackView.vue | 已完成：流程结果与返回动作 |
| Account | /identity/member-callback：team_mismatch | MemberIdentityCallbackView.vue | 已完成：确认切换与取消保留当前身份 |
| Account | /identity/member-callback：自动领取/准备 | MemberIdentityCallbackView.vue | 已完成：流程面板承载进度，自动领取逻辑不变 |
| Account | /identity/member-callback：失败/停止重试 | MemberIdentityCallbackView.vue | 已完成：结果原因与切换身份/团队 |
| Account | /identity/workspace-warning：无效/加载/失败 | WorkspaceWarningView.vue | 已完成：流程面板承载原三种状态 |
| Account | /identity/workspace-warning：外部身份确认 | WorkspaceWarningView.vue | 已完成：当前身份到目标团队的关系与确认动作 |
| Account | /identity/current/:section?：过渡 | CurrentEntityRedirectView.vue | 已完成：统一流程面板，保持兼容 section 参数 |
| Account | /identity/current/:section?：失败 | CurrentEntityRedirectView.vue | 已完成：失败标题与重试，安全跳转逻辑不变 |
| Chat | /：无可选会话 | ChatView.vue | 已完成：两栏会话工作台与主区占位 |
| Chat | /、/?conversation=uuid：选中会话 | ChatView.vue | 已完成：会话列表＋消息主区，原第三栏改可展开详情 |
| Chat | /：单聊/群聊/临时/关闭 | ChatView.vue | 已完成：保留屏蔽、退出、临时信息及只读历史分支 |
| Chat | /new：无预填 | NewConversationView.vue | 已完成：关联任务导航＋人员查找与选择面板 |
| Chat | /new?participant=slug：预填 | NewConversationView.vue | 已完成：同一任务版型，保留准确标识搜索及手动提交 |
| Chat | /requests：邀请 | RequestsView.vue | 已完成：任务导航＋待处理邀请与原接受/拒绝动作 |
| Chat | /requests：屏蔽 | RequestsView.vue | 已完成：同一治理面板下独立分组与解除动作 |
| Team | /join：join | JoinView.vue | 已完成：居中申请流程＋填写/审核进度 |
| Team | /join：reinstate | JoinView.vue | 已完成：复职语义与原身份保留说明 |
| Team | /join：ref 邀请人 | JoinView.vue | 已完成：保留邀请人确认与只读来源 |
| Team | /join：加载/失败/提交成功 | JoinView.vue | 已完成：状态放在申请步骤内，原提交语义不变 |
| Team | /join：历史申请/取消 | JoinView.vue | 已完成：历史申请从提交 form 移至同面板独立区 |
| Admin | /forbidden | ForbiddenView.vue | 已完成：结果标题、权限原因、恢复面板与账号登录动作 |

Account / 为 /login 跳转、Admin 未匹配路径为 / 跳转，不是独立系统结果页；Account /teams 由目录对话负责，未纳入本目标。Admin /system 是经营中的系统状态页，非系统结果，归其他模板。

## 必要版型

- 身份流程：居中、稳定阅读宽度；流程说明与当前步骤清楚分组，表单操作连续，身份选择保留候选容量。不能改成第六左对齐模板。
- 会话协作：会话导航、消息时间线和输入区构成持续工作台；邀请/屏蔽作为关联治理入口。窄屏遵守现有单会话展开与返回行为。
- 系统结果：结果说明、原因与恢复路径同一阅读顺序，不能只有孤立空状态。
- 第六左对齐模板及已经认可的概览保持原样。背景材质复用既有能力，不改公共UI、全局路由与外壳；缺口记录后交中央处理。

## 实施证据与交接

截至本次提交，上表全部分支的版型实施已完成；**未完成页面：无**。这里的完成仅指源代码迁移和本地交付，不代表测试或业务验收通过。

- Account：新增应用专属 AccountFlowPage，7 个 views 接入；登录/注册/恢复由营销双栏变为居中流程。身份和系统过渡页面移除旧白卡外壳，保留原因与恢复动作。没有修改 AuthShell、App 或 router。
- Chat：新增 ChatScene（只组合既有主题与场景）和 ChatTaskPage（关联任务导航＋内容）；消息页从固定三栏变为两栏，并将身份、参与者和临时信息放入可展开详情，窄屏保留原返回行为。
- Team：JoinView 直接组合既有主题、场景、页头与面板，不导入 Account 源码；移除巨字营销双栏，申请和历史按流程排列。
- Admin：ForbiddenView 由孤立居中空状态改为结果标题、原因和恢复面板，原清理认证后跳转登录动作保持。
- 仅修改上述分配 views、应用专属组件和本文；公共 UI、公共路由/外壳、总覆盖表及旧第六模板均未修改。

### 预览

四张真实 Vite 整页 PNG 位于工作区 .codex/identity-results/：account-login.png、chat-conversation.png、team-join.png、admin-forbidden.png。Chat 身份及消息明确标注模拟；申请使用空字段模拟响应；登录和无权限页为真实静态内容。所有 API 在浏览器拦截，未访问生产。未打开/OCR PNG。Chat 首次渲染脚本选中了列表内隐藏文本，改用消息气泡定位后完成截图；这只是预览定位修复。

公共组件预览命令：npm run preview:components -- --components LsPanel,LsButton --json；generated=2、failed=0，附件仅供人类。没有修改公共组件或预览注册目录。

### 剩余工作与公共缺口

- 分配路由未实施项：无；Account /teams 和 Display 404 不在本目标。Chat /profile、Account / 和 Admin 未匹配路径是原兼容跳转，无独立页面，保持原样。
- 按授权不运行测试、验收、typecheck、全量构建；动态业务、权限、移动端及所有状态的集中验证由主对话处理，本次不宣称通过。
- 本次没有需要阻塞页面迁移的公共组件缺口。身份流程与会话协作仍为应用专属组件；如后续统一认证/结果模板，需要中央协调公共包，不在本任务复制为公共万能模板。
- 沿用已有公共材质；Chat 历史 NButton/NInput 等控件仍由既有 Naive 主题提供状态，未跨范围重构全部交互。
- node_modules 与 .wiki-venv 通过 junction 复用主工作区；预览端口 5201—5204 用后停止。预览脚本与 PNG 忽略提交，保留供批阅。
- 生命周期：已完成等待审查。本地提交；不合 main、不推送、不部署、不更新公共 demo、不删除环境。
