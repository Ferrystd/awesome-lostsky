---
title: 应用模板
tags: [app]
audience: []
aliases: []
---

<%*
const zh = await tp.system.prompt("中文名（如：微博）");
const en = await tp.system.prompt("app名（如：weibo）");
const description = await tp.system.prompt("请输入description");
await app.fileManager.processFrontMatter(tp.config.target_file, (frontmatter) => {
  frontmatter.title = `${zh}（${en}）`;
  frontmatter.tags = ["app"];
  if (description) frontmatter.description = description;
  else delete frontmatter.description;
  frontmatter.audience = [];
  frontmatter.aliases = [zh, en];
});
await tp.file.rename(en);
const appsIndex = app.vault.getAbstractFileByPath("includes/apps.txt");
if (!appsIndex) throw new Error("找不到应用索引：includes/apps.txt");
await app.vault.append(appsIndex, `[${zh}]: /app/${en}/\n\n`);
%>

## 简述

## 功能

## 最佳实践

###
