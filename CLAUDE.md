# CLAUDE.md

[项目文档](docs/dev/index.md) · [产品定义](docs/dev/product.md) · [设计系统](docs/dev/design.md) · [OpenAPI](docs/dev/openapi/README.md)

[开发须知](docs/dev/development/development.md) · [代码更新清单](docs/dev/development/checklist.md) · [测试须知](docs/dev/development/testing.md) · [发布须知](docs/dev/development/releasing.md) · [运维文档](docs/dev/operations/deployment.md)

开始任何任务前，必须先阅读 [项目文档索引](docs/dev/index.md)，并继续阅读与当前任务直接相关的 Wiki 页面；Wiki 是项目规则的唯一正文来源。前端任务至少阅读产品定义、设计系统、前端约定、代码更新清单和测试须知，完成后按前端约定执行完整静态发布构建。

新增或修改后台页面结构时，必须阅读并执行[后台页面组件化方法](docs/dev/design/admin/componentization.md)：实施前在回复中给出组件化盘点；达到抽象阈值时主动创建组件、迁移全部同义用法并删除旧 CSS，不等待用户额外提醒。

新增或改变用户可见功能时，必须先只读参考[用户文档](docs/user/index.md)及对应章节，以用户目标、可观察结果和使用边界指导实现与测试。`docs/user/` 由人工维护，开发侧差异按[文档管理方法](docs/dev/development/wiki.md)处理。

无论 user 使用什么语言，用中文回应。

## Claude 专属差异

- **preview-components**：`.agents/skills/preview-components/` 仅由 codex 调用。Claude 一律不得调用该技能，不得按该技能流程生成组件预览，也不得打开、读图、OCR、比较或分析 `frontend/component-previews/generated/*.png`。前端对话提及或改动 `frontend/component-previews/catalog.json` 已登记组件时，直接依据源码与 DOM 处理，不生成或展示组件预览图片。
- **commentary**：AGENTS.md 中「实施前在 commentary 给出组件化盘点」对 Claude 而言，即在动手前于本回复正文中用中文给出组件化盘点。
