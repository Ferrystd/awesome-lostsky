# 文档管理与发布

`docs/` 按受众分为两个互不嵌套的正文根目录，并分别构建公开站点，不生成中间副本：

- `docs.lostsky.work` 使用 `zensical.toml`，只以 `docs/dev/` 为根目录构建开发文档。
- `doc.lostsky.work` 使用 `zensical.guide.toml`，只以 `docs/user/` 为根目录构建用户指南。

## 维护归属

用户明确授权的生成文档例外：`docs/user/dictionary/permissions.md` 由 `php think docs:permissions` 生成。其说明正文在 `Templates/dictionaries/permissions-user.md` 维护，权限数据取自 `PermissionDictionary`；不要直接修改生成文件。此例外不扩展到其他手册文件。

- **`docs/user/`：人工编写和维护的用户侧文档。** AI 只读参考，不自动新增、纠错、重写、移动或删除其中的文件，也不将开发正文同步覆盖到该目录。
- **`docs/dev/`：AI 维护的开发侧文档。** 面向开发、测试、运维和发布，负责产品实现约束、技术事实、接口、流程与计划。公开发布不改变其读者和维护归属。
- AI 发现手册与已确认需求或实际实现不一致时，在交付中列出具体页面、差异和建议，由人工处理；不以“文档同步”“修复构建”或生成命令为由改动手册。
- 两类文档可以通过各自站点 URL 互相引用，但不是需要自动双向同步的副本。本文中的维护流程默认只适用于开发侧文档；开发站不收录用户文档正文。

## 首次初始化

Wiki 构建依赖 Zensical 与 glossary 扩展（Python >= 3.12）。若现有 `.wiki-venv` 低于该版本，`npm run docs:setup` 会仅重建该项目内的虚拟环境。

用户指南的概念提示由 `zensical-glossary` 生成；每个概念页在定义正文前使用 `<!-- zensical-glossary: 术语 -->` 登记，`docs/user/Templates/concept.md` 会为新概念写入该标记。用户可见的 `docs/user/glossarys.md` 是圈内黑话的专用词表，由二级标题登记术语并在正文中维护释义。仓库根目录的 `zensical_glossary_zh.py` 只补充连续中文术语匹配与中文锚点回退，不另存一份概念释义索引。

```bash
npm run docs:setup
```

## 本地预览与发布构建

### 用户指南元数据与阅读入口

用户指南使用 Zensical `0.0.65` 的原生 tags，主题名称直接使用中文。受众、状态、主题词表统一定义在 `zensical.guide.toml` 的 `project.extra`，信息栏使用 `guide_theme/` 模板并沿用主题的文字、配色与链接样式。信息栏在标题下集中展示适合读者、内容核对日期、可选页面状态和原生标签，窄屏自动换行；正文不重复展示第二组标签。升级先以 `0.0.58` 独立验证旧配置的双站严格构建，再锁定并验证 `0.0.65`。

- `audience` 必须是非空列表：`all`（所有读者）、`team-admin`（团队管理者）、`member`（团队成员）、`customer`（顾客）、`admin`（平台管理员）。`all` 不与其他值混用；它的文章会出现在每个角色的阅读列表中。阅读分类不构成权限检查。
- `tags` 必须来自配置中的中文主题词表。`docs/user/tags.md` 使用原生标签索引，标签可跳到相关主题，搜索支持标签筛选。
- `reviewed_at` 使用 `YYYY-MM-DD` 或空值。只有实际核对业务内容后才填写日期；现有空值显示“待核对”，不能把构建时间或批量迁移日期当作复核日期。非法和未来日期阻止校验；超过 180 天仅提醒维护者。
- `status` 默认省略；可选 `new`、`beta`、`deprecated`，中文名由配置映射。`beta` 和 `deprecated` 必须同时填写 `status_note`，说明限制或替代方案；信息栏展示这段说明，导航沿用原生状态标记。
- `title`、`description` 必须是非空文本。`Templates/` 与 `includes/` 不参与元数据和受众索引；模板使用空标签和 `search.exclude` 从主题与搜索结果排除，Templater 创建正式页面时设置中文标签并删除搜索排除属性。Obsidian 模板选择受众并初始化空复核日期，创建后可在属性中增加受众或可选状态。当前构建器的 `exclude_docs` 未可靠排除模板，不能将隐藏索引视作访问控制或承诺模板文件不被输出。

修改文章的标题、描述、受众或增删页面后，运行 `npm run generate:docs:metadata` 更新 `docs/user/audience.md`；该索引只汇总页面元数据，不生成业务正文。`npm run check:docs:metadata` 只读验证全部公开指南元数据与索引是否最新。双站构建和指南预览启动前均执行此检查。编辑权限字典元数据时修改 `Templates/dictionaries/permissions-user.md`，再运行 `php think docs:permissions`，不要直接编辑生成页。

校验脚本的边界回归：`.wiki-venv/Scripts/python.exe frontend/scripts/test_guide_metadata.py`（非 Windows 使用 `.wiki-venv/bin/python`）。自定义主题变动同时检查标签聚合、角色链接、桌面与移动端布局，并运行 `npm run build:docs` 和 `npm run build`。

```bash
npm run docs:dev
npm run docs:dev:guide
npm run build:docs
```

`docs:dev` 与 `docs:dev:guide` 只启动对应预览站，不执行字典一致性检查。`build:docs` 先执行只读字典检查，再依次以 `--clean --strict` 构建开发站和用户指南站；任一步失败都会停止，不代表后一个站已完成。输出分别在 `www/docs.lostsky.work/` 与 `www/doc.lostsky.work/`，不纳入 Git。

<a id="build-failure-boundaries"></a>

### 构建失败与维护边界

- **依赖缺失**：运行 `npm run docs:setup`，使用 `docs/dev/requirements.txt` 的锁定依赖；不临时降低 strict 检查。
- **生成字典过期**：先核对对应服务、权限定义和模板。`npm run check:docs` 不写文件；`npm run generate:docs` 会写入开发字典和用户权限字典。任务明确禁止操作用户文档时，不运行该全量生成命令，也不通过生成器绕过限制；Service 字典可单独运行 `php think docs:services`，权限字典需先确认命令的写入范围。
- **开发页面失效链接或导航**：修正开发侧正文及 `zensical.toml`，只引用已经存在且语义匹配的页面。不要为了满足旧链接恢复过期计划或创建空占位页。
- **人工手册错误**：记录具体路径、错误和影响，不改手册、不全局忽略 warning。开发侧检查可继续，但必须明确完整双站构建尚未通过。
- **清理后缺少入口**：失败的 clean 构建可能留下不完整站点。先修复所属范围的错误，再重建对应站；本地 `index.html` 不存在时先排查构建，不先修改 Nginx 或用户正文。不得将失败输出当作可部署产物。

仅诊断某个站时，可用 `.wiki-venv` 中的 Python 执行 `-m zensical build --config-file zensical.toml --clean --strict`（用户指南替换为 `zensical.guide.toml`）；这不包含字典检查，也不等于双站验证。

## 维护规则

### 正文职责与事实来源

每条规则只维护一处完整正文，其他页面用摘要和链接引用。按读者要解决的问题选择位置：

| 内容 | 正文位置 | 核验依据 |
| --- | --- | --- |
| 产品目标与实现约束 | `product.md` | 已确认需求、人工手册、实际功能与行为测试 |
| 视觉与交互规范 | `design.md`、`design/admin/` | 公共组件契约、页面实现与结构测试 |
| 应用职责、身份与数据范围 | `apps/` | 应用路由、控制器中间件与服务授权 |
| 跨应用机制与技术约束 | `architecture/` | 中间件、共享服务、配置与对应测试 |
| 请求和响应结构 | `openapi/*.json` | 路由、请求校验、返回 DTO 与契约测试 |
| 开发、验证、发布方法 | `development/` | 实际脚本、锁文件与命令结果 |
| 部署、任务、清理与故障恢复 | `operations/` | 配置、命令实现、部署模板；线上状态需另行实测 |
| 开发术语 | `glossary/` | 对应领域正文；Service 字典从代码生成 |
| 尚未完成的工作 | `TODO.md`、`plans/` | 明确的问题、当前缺口与验收条件 |
| 已发布历史 | `changelog.md`、`updates.md` | 对应版本交付记录；不改写成当前行为 |

Wiki 是项目规则正文来源；代码和测试用于证明当前实现。两者冲突时，先区分“文档过期”与“实现缺陷”：有当前代码、契约或已确认变更支持的过期描述直接纠正；尚未确认的产品决策标为待确认，不通过改文档将缺陷合理化。工作区可能领先于已发布版本，核验记录必须说明使用当前工作区、提交还是发布标签，不能据本地代码声称线上已经部署。

### 一次文档维护的流程

1. **盘点范围**：记录已有工作区和暂存区差异、排除目录、入口导航、生成文档和历史记录；保留其他任务改动。
2. **按风险核验**：先检查鉴权和数据边界、部署与迁移命令，再检查功能状态、路径、术语和重复内容。对每个待纠正结论找到具体路由、服务、配置或测试依据。
3. **处理内容**：保留仍有效规则；纠正已变行为；重复内容收敛到领域正文；补齐缺失的前置条件、边界、失败恢复和验证方法。没有证据的内容不扩写。
4. **清理生命周期**：计划明确标为“未实现”“部分实现”或“待确认”，列出剩余工作和验收条件。完成后把必要结果迁入应用、架构或运维正文，删除重复计划及临时需求稿；历史由 Git 和版本日志保留，不继续列在待办导航。删除前检索全部入站链接。
5. **验证交付**：更新索引与导航，运行 `npm run build:docs`，检查最终差异；交付说明主要纠错、验证结果及仍未核实的边界。构建成功只能证明生成内容和站点检查通过，不能代替业务事实核验。

变更触发维护优先于定期重写：路由/权限变化检查应用和架构正文；脚本/配置变化检查开发与运维说明；计划交付后立即收敛；发布前复核升级步骤及当前功能边界。维护责任随变更归属，由该变更实施者同步、审查者核验；不为每页添加容易失真的“最后更新”日期。

### 链接、生成内容与范围

AI 新增开发文档时直接编辑 `docs/dev/` 下对应 Markdown，并同步更新 `zensical.toml` 导航。人工新增、改名或删除用户指南页面后，按已经存在的正文同步 `zensical.guide.toml`，不代写用户文档；开发站导航不收录用户页面。

开发术语在 `docs/dev/glossary/`，由 AI 维护，可含架构引用与代码路径；用户术语由人工维护。新增开发术语同步开发登记表、索引和导航；需要用户解释的新概念提交人工补充建议，不自动建立用户侧页面。通知的开发规则以 [`docs/dev/apps/team.md#通知机制`](../apps/team.md#notification-mechanism) 为正文，独立 Notice 术语页尚未建立；引用不转移用户文档维护权。`service.md` 由 `php think docs:services` 生成到 `docs/dev/glossary/`，禁止手改。

Markdown 页面链接使用相对路径和有效锚点，正文应链接具体页面而不是没有索引的目录。跨站引用使用公开站点 URL，不让一个站点的构建根越界读取另一个正文目录。代码位置使用仓库相对路径作检索线索，不复制大段实现。不得通过关闭 strict 检查掩盖失效链接；生成字典过期时运行 `npm run generate:docs` 后再构建。`npm run build:docs` 先检查 Service 和两侧权限字典，再严格构建开发站和用户指南站；即使只改开发文档，也会验证两个站点。

字典采用“手写模板 + 占位符 + 真实 Markdown”。字典模板作为生成源的例外，位于站点目录外的 `Templates/dictionaries/`，不作为网站页面发布；开发侧生成正文写入 `docs/dev/`，用户侧权限字典写入 `docs/user/`。Service 模板使用 `{{services.methods}}`；两份权限模板使用 `{{permissions.team}}`、`{{permissions.dynamic}}`、`{{permissions.admin}}`。未知或缺失占位符会使生成失败。开发侧权限规则编辑开发模板；用户侧说明编辑用户模板；具体权限描述编辑 `PermissionDictionary::descriptions()` 和 `dynamicDescriptions()`。Service 仅生成到开发侧 `docs/dev/glossary/service.md`。

在项目根目录运行 `npm run generate:docs` 更新全部字典，运行 `npm run check:docs` 只校验。`docs/user/` 可直接作为独立 Obsidian Vault 打开，其 `.obsidian/` 配置和 `Templates/` 写作模板均使用 Vault 相对路径；从 Vault 内终端执行仓库命令前先切换到仓库根目录。Templater 可用于创建模板，不参与重复更新。终端和 CI 无需安装 Obsidian 插件。

项目文档不得写入凭据、Token、Cookie、内部地址或其他敏感信息。

`docs/dev/updates.md` 只摘要最近两个正式产品版本，完整事实以 [`docs/dev/changelog.md`](../changelog.md) 为准；正式产品版本发布时同步更新摘要，预发布和构建发布不滚动正式版本摘要。

## 参考人工手册开发

[`docs/user/`](https://doc.lostsky.work/) 是人工维护的用户可见功能说明。新增或改变用户功能时：

1. 先阅读手册及相关章节，结合当前需求确定用户、目标、前置条件、操作结果、边界与恢复路径；手册缺失不阻止执行已经明确授权的开发任务。
2. 尚未交付的内容写入 `docs/dev/plans/` 或 `docs/dev/TODO.md` 并标记状态，不得混入当前可用步骤。
3. 再据此同步产品与设计约束、应用边界、权限、OpenAPI 和实现。
4. 测试至少覆盖手册定义的成功结果、权限边界和主要恢复路径；测试说明可引用功能编号。
5. 入口、字段、结果或限制变化时，AI 在同一交付中报告需要人工更新的手册页面与差异，开发侧文档则直接同步完成。

手册说明用户可观察行为，`docs/dev/apps/` 定义应用职责与鉴权边界，`docs/dev/openapi/` 定义接口结构，架构文档定义跨功能技术约束。发现冲突时按已确认需求核验实现并维护开发侧正文；手册差异交由人工处理，不以现有实现自动覆盖手册。
