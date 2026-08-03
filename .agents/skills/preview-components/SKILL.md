---
name: preview-components
description: Render and show real LostSky Vue component previews from the repository. Use implicitly when a frontend conversation names, asks to inspect, compare, redesign, or verify a component registered in frontend/component-previews/catalog.json, or when code changes touch a registered component or a page that imports one. Also use for Chinese component aliases such as 按钮、对象字段卡片、团队壳层. Never substitute an AI-generated mockup for the code-rendered preview.
---

# LostSky 组件预览

从项目代码、主题和确定性夹具生成组件状态矩阵 PNG，并把最相关的图片直接展示在对话中。

## 选择组件

1. 读取 `frontend/component-previews/catalog.json`。
2. 按以下优先级匹配：明确组件名或 ID、中文别名、已修改的登记源码、当前页面的直接 import。
3. 一次最多选择 4 个最相关组件。大量变更只选择最直接受影响项，不批量展示所有间接受影响组件。
4. 普通讨论渲染当前代码；完成视觉代码修改后重新渲染，以确保展示的是修改后的版本。
5. 只有用户要求对比，或视觉回归风险较高且对比确有帮助时，才在修改前额外保留对照图；默认直接覆盖当前图。

## 生成预览

在仓库根目录运行以下命令之一：

```powershell
npm run preview:components -- --component LsButton --json
npm run preview:components -- --components LsButton,LsField --json
npm run preview:components -- --all --json
```

优先使用 `--components` 一次生成选中的组件。读取 JSON 中的 `generated` 与 `failed`：任何请求组件失败时命令会非零退出，必须报告失败原因并继续修复真实渲染链路；禁止用 AI 图片或手绘占位图掩盖失败。

## 展示与存储

- 使用 JSON 返回的绝对 `path`，在回复中通过 Markdown 图片语法嵌入 PNG，例如 `![LsButton 状态矩阵](C:/absolute/path/LsButton.png)`。
- 每张图说明组件名即可，不要把不相关的图片塞进回复。
- 生成物与 `report.json` 固定写入 `frontend/component-previews/generated/`，直接覆盖且不提交 Git。
- Story 或目录缺失时，先按开发 Wiki 的契约补齐代码，再生成预览。

## 完成标准

确认截图来自 Playwright 真实渲染，包含固定的默认、hover、focus、active/selected、disabled/read-only、loading、error/empty 与移动端状态位置；组件不支持的状态必须显示“不适用”及原因。视觉修改的最终回复至少展示一个最直接受影响组件的最新图片。
