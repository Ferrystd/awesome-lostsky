# 组件代码预览

组件预览系统从真实 Vue 代码渲染状态矩阵，供开发者与 Agent 在讨论、修改和验收界面时查看。它不改变产品运行时，也不得用 AI 生成图片替代。

## 范围与目录

- `frontend/component-previews/catalog.json` 是预览目录，当前登记全部 41 个 `components/` 目录中的 Vue 组件：23 个 `@lostsky/ui` 公共组件和 18 个应用组件。
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
2. 普通讨论展示当前版本；视觉代码修改完成后重新渲染并展示最新版本。
3. 使用命令 JSON 返回的绝对路径嵌入 Markdown 图片。大量变更只展示最直接受影响项。
4. 根据用户要求与视觉回归风险判断是否保留修改前后对比；默认只覆盖并展示当前版本。
5. 真实渲染失败时报告并修复原因，禁止改用 AI 图片。

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

全量预览应生成 41 张非空 PNG 和一份无失败项的报告。
