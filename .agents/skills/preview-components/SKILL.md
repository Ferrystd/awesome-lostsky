---
name: preview-components
description: Render and attach real LostSky Vue component previews for the human user. Use implicitly when a frontend conversation names or changes a component registered in frontend/component-previews/catalog.json. Generated PNGs are human-only opaque outputs: never open, inspect, OCR, compare, or use them as model input. Never substitute an AI-generated mockup for the code-rendered preview.
---

# LostSky 组件预览

从项目代码、主题和确定性夹具生成组件状态矩阵 PNG，并把最相关的图片作为只供人类查看的附件展示在对话中。

## 使用限制

本技能仅由 codex 调用。其他 Agent（Claude、Cursor 等）一律禁止调用本技能，也不得按本技能流程生成、读取或处理组件预览。

## 人类专用输出（硬性规则）

- PNG 是不透明的交付附件，不是 Agent 的输入。禁止调用 `view_image`、截图工具、OCR、图像分析或任何可读取图片内容的工具打开 `frontend/component-previews/generated/*.png`。
- 即使图片已出现在对话历史中，也不得描述、比较或依据其中的像素推断布局、颜色、间距和视觉问题。
- Agent 的实现与验收只能依据源码、组件契约、结构化 DOM、可访问性树、Playwright 断言、控制台与网络错误、溢出指标和自动化测试。
- 如果用户反馈图片中的问题，使用用户提供的文字定位源码与 DOM；除非用户在当前请求中明确撤销本规则，否则不要自行读取图片确认。
- 先完成代码与非图像验证，最后每个相关组件只生成一次并嵌入回复。不得为了内部推理、视觉迭代或“再确认一次”反复生成或读取图片。

## 选择组件

1. 读取 `frontend/component-previews/catalog.json`。
2. 按以下优先级匹配：明确组件名或 ID、中文别名、已修改的登记源码、当前页面的直接 import。
3. 一次最多选择 4 个最相关组件。大量变更只选择最直接受影响项，不批量展示所有间接受影响组件。
4. 普通讨论在回复前渲染当前代码；视觉代码修改只在非图像验证完成后渲染最终版本。
5. Agent 不做图片前后对比。用户明确要求对比时可以把两份附件交给用户自行比较，但不得读取或评价图片内容。

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
- 只处理 JSON 中的路径、尺寸和失败信息；不要打开该路径指向的图片。
- 每张图说明组件名即可，不要把不相关的图片塞进回复。
- 生成物与 `report.json` 固定写入 `frontend/component-previews/generated/`，直接覆盖且不提交 Git。
- Story 或目录缺失时，先按开发 Wiki 的契约补齐代码，再生成预览。

## 完成标准

通过命令退出码、JSON 报告、Story 契约与结构化页面断言确认 Playwright 已完成真实渲染；不要通过读图确认。矩阵契约固定包含默认、hover、focus、active/selected、disabled/read-only、loading、error/empty 与移动端状态位置，组件不支持的状态由宿主显示“不适用”及原因。视觉修改的最终回复至少附上一个最直接受影响组件的最新图片供用户查看。
