---
title: 专有名词单页模板
description: LostSky 术语单页的统一结构与新增流程。
tags: [glossary]
---

# 专有名词单页模板

本页定义术语单页的唯一结构。新增术语时，用 Obsidian Templater 的「术语单页模板」（`Templates/术语单页模板.md`，通过「Templater: Create new note from template」创建）生成页面；本页供人工与审查对照，两边结构保持一致。

## 页面约定

- 文件名：英文小写连字符 slug，例如 `virtual.md`。
- frontmatter：`title`（双语）、`description`（一句话）、`tags: [glossary]`、`status`（`待编写` / `已建页` / `生成文档`）、`aliases`（中文名与英文名）。
- H1 与 `title` 一致，双语 `# 中文名（English）`。

## 小节结构

```markdown
---
title: 中文名（English）
description: 一句话说明，待人工补充。
tags: [glossary]
status: 待编写
aliases: [中文名, English]
---

# 中文名（English）

## 定义

待人工补充。

## 使用场景

待人工补充。

## 不包括什么

- 待人工补充。

## 相关概念

- 待人工补充。

## 来源与示例

待人工补充。
```

各小节约定：

- **定义**：一句话给出概念边界，不写实现细节。
- **使用场景**：说明该概念何时、如何被消费。
- **不包括什么**：1–3 条反例，排除常见误读。
- **相关概念**：一律使用 `- [术语](x.md)` 列表。
- **来源与示例**：站点差异节。dev 侧副本（`docs/glossary/`）指向代码或架构文档并给实现示例；用户侧副本（`docs/manual/glossary/`）改写为用户视角的业务示例，不出现 `app/` 路径或 dev 链接。

## 特殊类

- **生成文档**（如 [service.md](service.md)）：由命令生成，结构豁免；frontmatter 由生成器负责，`status` 固定为 `生成文档`，禁止手改。
- **词簇页**（如 [notice.md](../manual/glossary/notice.md)）：一页解释一组相关子概念时豁免小节结构，但保留 frontmatter 与双语 H1。

页面命名使用稳定的小写连字符文件名；中文、英文和页面文件名确定后，不因界面文案的小改动频繁更名。
