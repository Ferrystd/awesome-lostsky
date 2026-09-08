# AGENTS.md

[项目文档](docs/index.md) · [产品定义](docs/product.md) · [设计系统](docs/design.md) · [OpenAPI](docs/openapi/README.md)

[开发须知](docs/development/development.md) · [代码更新清单](docs/development/checklist.md) · [测试须知](docs/development/testing.md) · [发布须知](docs/development/releasing.md) · [运维文档](docs/operations/deployment.md)

开始任何任务前，必须先阅读 [项目文档索引](docs/index.md)，并继续阅读与当前任务直接相关的 Wiki 页面；Wiki 是项目规则的唯一正文来源。前端任务至少阅读产品定义、设计系统、前端约定、代码更新清单和测试须知，完成后按前端约定执行完整静态发布构建。

适时暂存代码：完成可独立说明且已通过直接验证的阶段后，按[工作区保护与阶段性暂存](docs/development/contributing.md#staged-worktree-baseline)建立暂存基线；只纳入当前任务已确认的改动，保留无关差异与已有暂存内容。

新增或修改后台页面结构时，必须阅读并执行[后台页面组件化方法](docs/design/admin/componentization.md)：实施前在 commentary 给出组件化盘点；达到抽象阈值时主动创建组件、迁移全部同义用法并删除旧 CSS，不等待用户额外提醒。

新增或改变用户可见功能时，必须先只读参考[使用手册](docs/manual/index.md)及对应章节，以用户目标、可观察结果和使用边界指导实现与测试。文档归属与差异反馈遵循[文档管理方法](docs/development/wiki.md)：manual 由人工维护，其余开发文档由 AI 维护。

无论user使用什么语言，用中文回应。

前端对话提及、检查或改动 `frontend/component-previews/catalog.json` 已登记组件时，必须使用 `.agents/skills/preview-components/` 从真实代码生成并展示最多 4 个最相关预览；PNG 只供人类查看，Agent 禁止打开、读图、OCR、比较或据其调整代码，也禁止用 AI 生成图片代替组件真实渲染。
