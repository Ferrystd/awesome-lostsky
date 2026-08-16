# 文档站构建

`docs/` 是所有项目文档的唯一正文来源，并构建两个内容重叠的公开站点，不生成中间副本：

- `docs.lostsky.work` 使用 `zensical.toml` 构建完整项目文档。
- `doc.lostsky.work` 使用 `zensical.guide.toml`，只以 `docs/manual/` 为根目录构建用户指南。

## 首次初始化

Wiki 构建依赖 Zensical（Python >= 3.10）

```bash
npm run docs:setup
```

## 本地预览与发布构建

```bash
npm run docs:dev
npm run docs:dev:guide
npm run build:docs
```

## 维护规则

新增文档时直接编辑 `docs/` 下对应 Markdown，并同步更新 `zensical.toml` 导航。新增、改名或删除用户指南页面时还需同步更新 `zensical.guide.toml`。

名词页为双副本结构：dev 术语源在 `docs/glossary/`（可含架构引用与 `app/` 路径，仅 dev 站构建），用户侧副本在 `docs/manual/glossary/`（用户语言，不出现 dev 引用）；`notice.md` 为两站共享单页。`zensical.toml` 的「术语」节列出 `docs/glossary/` 全部页面，`zensical.guide.toml` 的「名词解释」只收录用户可见分类；新增或改动名词页时，两份副本与两个导航都要同步。`service.md` 由 `php think docs:services` 生成到 `docs/glossary/`，禁止手改。

项目文档不得写入凭据、Token、Cookie、内部地址或其他敏感信息。

`docs/updates.md` 只摘要最近两个正式产品版本，完整事实以 [`docs/changelog.md`](../changelog.md) 为准；正式产品版本发布时同步更新摘要，预发布和构建发布不滚动正式版本摘要。

## 由使用手册驱动功能

[`docs/manual/`](../manual/index.md) 是用户可见功能的入口和行为基线。新增或改变用户功能时按以下顺序维护：

1. 先在手册中写清用户、目标、前置条件、操作结果、边界与恢复路径；为独立能力分配稳定功能编号。
2. 尚未交付的内容写入 `docs/plans/` 或 `docs/TODO.md` 并标记状态，不得混入当前可用步骤。
3. 再据此同步产品与设计约束、应用边界、权限、OpenAPI 和实现。
4. 测试至少覆盖手册定义的成功结果、权限边界和主要恢复路径；测试说明可引用功能编号。
5. 发布前以真实界面复核手册；入口、字段、结果或限制变化时，同一个变更内更新手册。

手册定义用户可观察行为，`docs/apps/` 定义应用职责与鉴权边界，`docs/openapi/` 定义接口结构，架构文档定义跨功能技术约束。发现冲突时先确认预期用户行为，再同步各层，不以现有实现自动覆盖手册。
