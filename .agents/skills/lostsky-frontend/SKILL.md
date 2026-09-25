---
name: lostsky-frontend
description: >
  已永久弃用，仅为历史追溯保留。任何前端任务均不得调用本技能；请遵循项目 AGENTS.md 中的
  前端技能规则，使用 impeccable 作为设计主技能，并将 ui-ux-pro-max 限于专项检查。
deprecated: true
---

# LostSky 前端页面构建

> **永久弃用：禁止调用。** 本文件记录旧版静态页面工作流，不再符合当前 Vue 3、Vite、Naive UI 与自动构建架构。

为 LostSky 项目构建前端页面的完整工作流。支持官网静态页面（`www/`）和管理后台界面。每一步完成后等待用户确认再继续。

## 项目前端架构

```
www/
├── assets.lostsky.work/
│   ├── css/
│   │   ├── base.css           # 🔒 锁定 - 重置、CSS 变量、排版基础
│   │   ├── components.css     # 🔒 锁定 - 玻璃面板、卡片、按钮等复用组件
│   │   ├── animations.css     # 🔒 锁定 - 关键帧动画
│   │   └── page-{name}.css    # ✏️ 可写 - 页面专属样式（≤80行）
│   ├── js/
│   │   ├── tailwind.config.js # 🔒 锁定 - 全局 Tailwind 配置（单点维护）
│   │   ├── utils.js           # 通用工具函数
│   │   ├── api.js             # 管理后台：JWT + fetch 封装
│   │   └── page-{name}.js     # ✏️ 可写 - 页面专属脚本
│   └── images/
└── www.lostsky.work/
    └── {page}.html            # 各页面入口
```

### CSS 分层铁律

| 层级 | 文件 | 修改权限 | 包含内容 |
|------|------|----------|----------|
| 基础层 | `base.css` | ❌ 永不修改 | CSS 变量、reset、body、滚动条、排版 |
| 组件层 | `components.css` | ❌ 永不修改 | `.glass-panel`、`.glass-card`、`.text-gradient`、`.btn-*` 等 |
| 动画层 | `animations.css` | ❌ 永不修改 | `@keyframes shimmer/float/fadeIn`、`.anim-*` 工具类 |
| 页面层 | `page-{name}.css` | ✅ 可修改 | 该页面特有的布局覆盖、微调样式 |

**任何页面修改任务，AI 只能动页面层 CSS 和 HTML 文件本身。触碰锁定文件会导致设计被意外篡改。**

**`page-{name}.css` 行数上限**：若该文件超过 ~80 行，必须暂停并审视——是否应把部分通用样式提升到 `components.css`（需用户审批后操作）。防止页面 CSS 膨胀回单文件噩梦。

### JS 架构约定

| 文件 | 权限 | 内容 |
|------|------|------|
| `tailwind.config.js` | 🔒 永不修改 | 全局配色、字体、断点。页面通过 `<script src="...">` 引用，**禁止各页面内联 config** |
| `utils.js` | 🔒 永不修改 | 通用 DOM 工具、防抖/节流、格式化函数 |
| `api.js` | 🔒 永不修改 | 管理后台专用：`apiGet()` / `apiPost()` / `apiPut()` / `apiDelete()`，统一请求 `api.lostsky.work`（app/slug 由后端通过浏览器自动携带的 Origin 请求头解析），从 localStorage 读取 JWT token |
| `page-{name}.js` | ✏️ 可写 | 页面专属交互逻辑 |

### API 请求约定

| 规则 | 说明 |
|------|------|
| API 基址 | 固定 `//api.lostsky.work`，不动态拼接 |
| 路径无 app 前缀 | **禁止** `/account/login/phone`，应写 `/login/phone` |
| app 解析 | 后端通过浏览器自动携带的 `Origin` 请求头解析 app（如 `https://account.lostsky.work` → app=`account`） |
| slug 解析 | 同理，`{slug}.{app}.lostsky.work` 的 Origin 会被 `route/app.php` 解析出 slug |

**路径写法对照：**

| ❌ 错误 | ✅ 正确 |
|---------|---------|
| `apiPost('/account/login/phone', ...)` | `apiPost('/login/phone', ...)` |
| `apiPost('/shop/product/add', ...)` | `apiPost('/product/add', ...)` |
| `apiGet('/team/member/index', ...)` | `apiGet('/member/index', ...)` |

### 设计语言

加载 /ui-ux-pro-max

### 禁止事项

以下行为绝对禁止，违反将导致设计不一致或锁定文件被破坏：

| 反模式 | 说明 | 正确做法 |
|--------|------|----------|
| 用 `!important` 覆盖锁定文件样式 | 说明页面层设计不够充分 | 在 `page-{name}.css` 中增加更具体的选择器 |
| 自创新的颜色值 | 破坏配色一致性 | 从 `base.css` CSS 变量或 Tailwind config 取色 |
| 自创新的圆角值 | 破坏视觉节奏 | 只允许 `rounded-2xl` / `rounded-3xl` / `rounded-full` |
| 修改锁定文件来"修复"布局 | 动摇整个设计体系 | 在 `page-{name}.css` 中写覆盖样式 |
| 新增 CSS 类名不以 `page-{name}-` 开头 | 污染全局命名空间 | 所有页面专属类名前缀 `page-{name}-` |
| 在页面内联 Tailwind config | 配色需改时无法统一修改 | 引用 `tailwind.config.js` |

---

## 阶段一：API 调研（使用低成本模型）

> 使用更廉价的模型

读取 `/docs/dev/openapi/` 中的 JSON 文件，分析该页面所需的 API 接口。输出。
---

## 阶段二：设计确认

### 2a. 读取现有设计资产

**必须先读取**以下文件，理解现有设计语言：
1. `www/assets.lostsky.work/css/components.css` — 可用组件类名
2. `www/assets.lostsky.work/css/animations.css` — 可用动画类名
3. 现有页面的 HTML（如 `www/www.lostsky.work/index.html`）— 参考风格

### 2b. 输出设计方案

向用户呈现设计方案（文字描述即可，不需要截图）：

1. **页面结构**：各 section 的顺序和内容
2. **组件映射**：哪些区域用 `glass-panel`、哪些用 `glass-card`
3. **新增样式**：需要新增的 `page-{name}.css` 中定义的自定义样式清单
4. **响应式策略**：移动端/桌面端的布局差异

### 2c. 检查风格一致性

对照已有页面，检查：
- 配色是否一致（主色 `#0ea5e9`、辅色 `#8b5cf6`）
- 间距节奏是否一致（section 用 `py-24`、标题用 `text-3xl md:text-4xl`）
- 动效风格是否一致（浮入用 `fade-in-element`、悬浮用 `glass-card` 自带）
- 圆角是否一致（面板 `rounded-2xl`/`rounded-3xl`、按钮 `rounded-full`）

**等待用户确认设计方案，再进入编码阶段。**

---

## 阶段三：页面构建

### 3a. 创建页面文件

1. **HTML 文件**：放在 `www/www.lostsky.work/{page}.html`
   - **Tailwind 配置**：`<script src="//assets.lostsky.work/js/tailwind.config.js"></script>` 引入共享配置，**禁止内联 config 块**
   - 引入 Tailwind CDN（`<script src="https://cdn.tailwindcss.com">`）
   - 引入分层 CSS：`base.css`、`components.css`、`animations.css`、`page-{name}.css`
   - 管理后台额外引入：`<script src="//assets.lostsky.work/js/api.js"></script>`
   - 复用已有组件类名（`glass-panel`、`glass-card`、`text-gradient`）
   - 保持 HTML 语义化，section 使用 `id` 锚点
   - **必填 Meta 标签**：
     - `<title>` — 页面标题
     - `<meta name="description">` — 页面描述（SEO）
     - `<meta property="og:title">` / `og:description` / `og:image` — Open Graph 分享预览
     - `<link rel="canonical">` — 规范 URL

2. **页面 CSS 文件**：放在 `www/assets.lostsky.work/css/page-{name}.css`
   - 仅写该页面特有的样式
   - 不重复定义组件层已有的类
   - 命名遵循 `page-{name}-{element}` 约定

### 3b. 链接已有页面

如果是新建页面，在相关已有页面添加导航链接（如首页 nav 中增加入口）。

### 3c. 构建校验清单

- [ ] 所有 CSS 引用路径正确（`//assets.lostsky.work/css/...`）
- [ ] Tailwind 配置中的自定义颜色与 `components.css` 一致
- [ ] 页面在 375px / 768px / 1280px 三种宽度下布局正常
- [ ] 所有 `glass-card` 交互状态正常（hover 上浮 + 边框变色）
- [ ] 渐变文字 `text-gradient` 正确渲染
- [ ] 新页面与现有页面风格统一

---

## 阶段四：审查与交付

### 4a. 代码审查

调用 `/code-review` skill 审查新增的前端代码，检查：
- HTML 语义化、可访问性（`alt`、`aria-label`）
- CSS 无冗余、无 `!important` 滥用
- 响应式断点合理

### 4b. 浏览器预览

使用 Playwright 打开页面截图，确认视觉效果与设计一致。

**等待用户最终确认，完成交付。**

---

## 修改现有页面时的额外规则

1. **只读锁定文件**：读取 `base.css`、`components.css`、`animations.css` 了解可用类名，但绝不修改
2. **增量修改**：只改目标 section 的 HTML + 对应的 `page-{name}.css`
3. **保持设计一致性**：不引入新的配色、新的圆角值、新的间距节奏
4. **变更前先读**：修改某个 section 前，必须完整读取该 section 的现有 HTML

## 快速参考：已有设计资产

| 资源 | 路径 |
|------|------|
| 首页参考 | `www/www.lostsky.work/index.html` |
| 基础层 | `www/assets.lostsky.work/css/base.css`（🔒 CSS 变量、reset、滚动条） |
| 组件层 | `www/assets.lostsky.work/css/components.css`（🔒 玻璃面板、卡片、渐变文字） |
| 动画层 | `www/assets.lostsky.work/css/animations.css`（🔒 shimmer、float、fade-in） |
| 首页样式 | `www/assets.lostsky.work/css/page-index.css`（✏️ 首页专属） |
| Tailwind 配置 | `www/assets.lostsky.work/js/tailwind.config.js`（🔒 全局配色/字体） |
| API 封装 | `www/assets.lostsky.work/js/api.js`（🔒 管理后台 fetch 封装） |
| 背景图 | `//assets.lostsky.work/images/site-bg.png` |
