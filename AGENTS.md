# AGENTS.md

[项目文档](docs/dev/index.md) · [产品定义](docs/dev/product.md) · [设计系统](docs/dev/design.md) · [OpenAPI](docs/dev/openapi/README.md)

[开发须知](docs/dev/development/development.md) · [代码更新清单](docs/dev/development/checklist.md) · [测试须知](docs/dev/development/testing.md) · [发布须知](docs/dev/development/releasing.md) · [运维文档](docs/dev/operations/deployment.md)

开始任何任务前，必须先阅读 [项目文档索引](docs/dev/index.md)，并继续阅读与当前任务直接相关的 Wiki 页面；Wiki 是项目规则的唯一正文来源。前端任务至少阅读产品定义、设计系统、前端约定、代码更新清单和测试须知，按[测试须知](docs/dev/development/testing.md)优先运行受影响用例，完成后按前端约定执行完整静态发布构建。

适时暂存代码：完成可独立说明且已通过直接验证的阶段后，主代理主动调用 `lostsky-git` 按[工作区保护与阶段性暂存](docs/dev/development/contributing.md#staged-worktree-baseline)建立暂存基线；当前任务达到可提交状态时，该子代理主动暂存并提交，无需等待另行要求。只纳入当前任务已确认的改动，保留无关差异与已有暂存内容。

用户一次派发多个任务，或一个任务包含可独立实施的步骤时，主代理必须使用 `.agents/skills/lostsky-task-orchestration/SKILL.md`，按[任务拆分与自动分支](docs/dev/development/contributing.md#task-orchestration)先确定依赖、文件归属、分支/worktree 和验收条件，再委派与整合。独立交付默认隔离工作区；同一交付中互不重叠的步骤可共享任务工作区。有依赖的步骤按顺序推进，不能为并行而同时修改共享文件。主代理自动推进本地建分支、验证、提交和符合门禁的本地合并；推送、部署及环境删除仍按独立授权执行，用户本次更具体的指令优先。

凡是创建或使用独立分支、worktree、临时开发环境或并行 Codex 任务，主代理必须按 [Git 任务生命周期](docs/dev/development/contributing.md#git-task-lifecycle)持续跟踪；任务结束时交给 `lostsky-git` 统一处理提交、验收与 Git 收尾，最终明确为“已合并并清理”“已合并但保留环境”“已完成等待审查”“因异常保留现场”或“明确决定不合并”，不得静默遗留。遇到工作区改动时先核对归属并主动处理，不把清理工作直接交还用户。

新增或修改后台页面结构时，必须阅读并执行[后台页面组件化方法](docs/dev/design/admin/componentization.md)：实施前在 commentary 给出组件化盘点；达到抽象阈值时主动创建组件、迁移全部同义用法并删除旧 CSS，不等待用户额外提醒。

新增或改变用户可见功能时，必须先只读参考[用户文档](docs/user/index.md)及对应章节，以用户目标、可观察结果和使用边界指导实现与测试。文档归属与差异反馈遵循[文档管理方法](docs/dev/development/wiki.md)：`docs/user/` 由人工维护，`docs/dev/` 由 AI 维护。

无论user使用什么语言，用中文回应。

多模型协作遵循[代理分工](docs/dev/development/contributing.md#多模型代理分工)：Astra 主代理统筹，非前端代码实现交 Sol；所有前端相关工作（包括检索、设计、实现、测试、审查与构建）均使用 Astra，非前端检索和测试可交 Luna。

前端对话提及、检查或改动 `frontend/component-previews/catalog.json` 已登记组件时，必须使用 `.agents/skills/preview-components/` 从真实代码生成并展示最多 4 个最相关预览；PNG 只供人类查看，Agent 禁止打开、读图、OCR、比较或据其调整代码，也禁止用 AI 生成图片代替组件真实渲染。
