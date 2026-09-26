---
title: 应用模板
tags: []
audience: [all]
reviewed_at:
search:
  exclude: true
aliases: []
---

<%*
const zh = await tp.system.prompt("中文名（如：微博）");
const en = await tp.system.prompt("app名（如：weibo）");
const description = await tp.system.prompt("请输入description");
const audience = await tp.system.suggester(["所有读者", "团队管理者", "团队成员", "顾客", "平台管理员"], ["all", "team-admin", "member", "customer", "admin"]);
if (!description || !audience) throw new Error("请填写描述并选择受众后重新创建");
await app.fileManager.processFrontMatter(tp.config.target_file, (frontmatter) => {
  frontmatter.title = `${zh}（${en}）`;
  frontmatter.tags = ["应用"];
  if (description) frontmatter.description = description;
  else delete frontmatter.description;
  frontmatter.audience = [audience];
  frontmatter.reviewed_at = null;
  delete frontmatter.search;
  delete frontmatter.status;
  delete frontmatter.status_note;
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
