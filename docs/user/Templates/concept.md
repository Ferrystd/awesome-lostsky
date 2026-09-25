---
title: 概念模板
tags: [concept]
audience: []
aliases: []
---

<%*
const zh = await tp.system.prompt("中文名（如：人员 ）");
const en = await tp.system.prompt("concept名（如：entity）");
const description = await tp.system.prompt("请输入description");
await app.fileManager.processFrontMatter(tp.config.target_file, (frontmatter) => {
  frontmatter.title = `${zh}（${en}）`;
  frontmatter.tags = ["concept"];
  if (description) frontmatter.description = description;
  else delete frontmatter.description;
  frontmatter.audience = [];
  frontmatter.aliases = [zh, en];
});
await tp.file.rename(en);
%>

## 定义

<%*
const definition = await tp.system.prompt("请输入定义");
tR += `<!-- zensical-glossary: ${zh} -->\n\n`;
tR += definition;
tR += "。";
%>

## 说明

## 设计理念
