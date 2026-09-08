---
<%*
const zh = await tp.system.prompt("中文名（如：微博）");
const en = await tp.system.prompt("app名（如：weibo）");
await tp.file.rename(en);
const description = await tp.system.prompt("请输入description");
tR += `title: ${zh}（${en}）`;
tR += description ? `\ndescription: ${description}` : '';
tR += `\ntags: [app]`;
tR += `\naliases: [${zh}, ${en}]`;
%>
---

# <% zh %>（<% en %>）

## 简述

## 功能

## 最佳实践

### 