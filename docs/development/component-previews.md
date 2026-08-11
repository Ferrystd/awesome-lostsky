# 组件代码预览

组件预览系统从真实 Vue 代码渲染状态矩阵，由 Agent 生成并展示给人类开发者查看。PNG 是人类专用的交付附件，不是 Agent 的视觉输入；它不改变产品运行时，也不得用 AI 生成图片替代。

## 范围与目录

- `frontend/component-previews/catalog.json` 是预览目录，当前登记全部 52 个 `components/` 目录中的 Vue 组件：32 个 `@lostsky/ui` 公共组件和 20 个应用组件。
- `frontend/component-previews/src/story-registry.ts` 聚合 Story；`ui-stories.ts` 和 `app-stories.ts` 提供确定性场景。
- `frontend/component-previews/src/PreviewHost.vue` 注入 LostSky 主题、中文 locale、Router、Pinia、Vue Query、消息与对话框 Provider。
- `frontend/component-previews/scripts/capture.mjs` 启动隔离的 Vite 宿主，以 Playwright 驱动交互并截图。
- `frontend/component-previews/generated/` 保存 PNG 和 `report.json`，每次渲染直接覆盖。该目录被 Git 忽略，不得提交。

目录条目必须包含唯一的 `id`、组件名、源码路径、Story 锚点、分类和全局唯一中文别名。目录契约测试会扫描所有 `frontend/**/components/*.vue`，确保组件全部且仅登记一次，源码与 Story 路径存在。

## Story 契约

每个组件输出一张固定矩阵图，位置依次为：默认、hover、键盘 focus、active/selected、disabled/read-only、loading、error/empty、移动端 390px。

Story 必须：

1. 使用真实组件、现有主题和确定性数据，不复制组件外观。
2. 至少支持默认与移动端状态；交互状态应由 Playwright 真实执行 hover、focus 和按压。
3. 对组件不支持的状态保留矩阵位置，并显示“不适用”及具体原因，不虚构组件能力。
4. 接口数据使用确定性 Playwright Mock；不得依赖登录态、远程资源或随机数据。
5. 等待字体、Teleport、过渡和异步夹具稳定后再截图；页面不得出现控制台错误或失败请求。

新增、移动或删除 `components/` 目录中的 Vue 组件时，必须在同一变更中同步目录和 Story，并更新当前固定数量。目录测试失败代表变更未完成。

## 命令

从仓库根目录按名称、ID 或中文别名运行：

```powershell
npm run preview:components -- --component LsButton
npm run preview:components -- --components LsButton,LsField
npm run preview:components -- --all
```

追加 `--json` 后，标准输出返回组件名、ID、绝对 PNG 路径、页面尺寸与失败信息。任一请求组件未找到或渲染失败时，命令非零退出；成功和失败详情仍写入 `frontend/component-previews/generated/report.json`。

## Agent 行为

仓库级 `.agents/skills/preview-components/` 允许隐式触发。前端对话明确提及登记组件、使用中文别名、修改登记源码，或修改直接导入登记组件的页面时，Agent 必须：

1. 按明确名称、别名、修改文件和页面 import 关系选择最多 4 个最相关组件。
2. 先完成源码、DOM、可访问性、控制台、网络、溢出指标和自动化测试验证；普通讨论在回复前渲染当前版本，视觉代码修改只渲染最终版本。
3. 使用命令 JSON 返回的绝对路径嵌入 Markdown 图片。大量变更只展示最直接受影响项。
4. `frontend/component-previews/generated/*.png` 只供人类查看。Agent 禁止通过 `view_image`、截图工具、OCR 或图像分析打开这些生成 PNG；即使图片出现在对话历史中，也不得描述、比较或根据像素调整布局。
5. 上述禁令不适用于用户在当前请求中提供的截图，也不适用于真实运行页的一次有界浏览器视觉验收。Agent 必须读取用户截图中的可见关系；需要自行确认时，应打开真实应用路由，同时读取页面画面、结构化 DOM、可访问性树、计算样式、控制台与网络状态，不得改读组件预览 PNG。
6. 每个相关组件在交付前只生成一次；不得为内部推理或反复确认持续生成图片。用户明确要求前后对比时只提供附件，由用户自行比较。
7. 真实渲染失败时报告并修复结构化错误，禁止改用 AI 图片。

## 三层视觉验收

视觉证据按用途分层，三层互补且不得互相替代：

1. **缺陷输入**：用户截图、设计参考或问题描述供 Agent 直接读取。Agent 必须先写出可观察关系，例如“同一行控件顶部不一致”“操作区持续挤压字段”“长文案溢出”，不能只记录“看起来不对”。
2. **机器验收**：真实运行页是 Agent 的视觉与结构化验收面。每轮视觉修改最多执行一次桌面与移动端合并检查、一次修复后确认；同时读取 DOM、可访问性、`getComputedStyle()`、`boundingBox()`、溢出、控制台和失败请求。凡能量化的可见关系必须进入 Playwright 或等价测试，截图本身不作为通过条件。
3. **人类交付**：组件预览 PNG 是稳定状态矩阵，供人类判断整体观感；Agent 只读取生成报告中的路径、尺寸和失败信息，不读取其像素。人类发现的新问题重新进入第一层，再由 Agent 转成第二层回归断言。

全面允许 Agent 读取组件预览 PNG 会形成“同一实现生成、同一 Agent解释”的循环证明，不能替代真实页面上下文、交互与几何测试；全面禁止任何图片输入又会丢失用户能直接指出的视觉证据。因此项目固定采用上述分层规则，不设页面级例外。

## 验证

至少运行：

```powershell
npm test
npm run typecheck
npm run preview:components -- --all
npm run build:docs
npm run build
git check-ignore frontend/component-previews/generated/LsButton.png
git diff --check
```

全量预览应生成 52 张非空 PNG 和一份无失败项的报告。
