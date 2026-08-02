# 后台基础令牌

## 适用范围

适用于全部后台应用及 `@lostsky/ui`。主题入口固定为 `frontend/packages/ui/src/naive-theme.ts`，语义 CSS 令牌固定为 `frontend/packages/ui/src/styles.css`。

## 颜色与表面

- 必须使用 `--surface`、`--surface-subtle`、`--text`、`--text-secondary`、`--border`、`--primary`、`--danger`、`--success`、`--warning` 等语义令牌。
- 主色只用于主操作、焦点、当前导航和必要状态；页面最多一个主操作。
- 连续数据使用一个白色有边界容器及细分隔线。独立卡片只用于内容确实相互独立的任务。
- 禁止后台使用展示型渐变、玻璃、Bento、装饰光晕、大范围阴影，以及边框与宽柔阴影同时出现。

## 字体、间距与尺寸

- 后台正文、Naive UI 控件和公共组件必须共同使用 `--font-ui`：`PingFang SC`、`Microsoft YaHei`、系统 UI 字体的固定回退顺序；同一操作组不得因原生链接与 Naive UI 按钮混用而改变字体、字号或字重。数字使用 `font-variant-numeric: tabular-nums`；正文对比度至少 4.5:1，非文本控件至少 3:1。
- 间距只使用 4、8、12、16、24、32、48px；新增间距值必须先补充本页并说明语义。
- 控件高度：`small=40px`、默认 `44px`、`large=48px`；同一操作组必须同尺寸。纯图标和移动端触控区至少 44×44px。
- 集合页工具栏在桌面使用 `small=40px` 的紧凑搜索与筛选控件，移动端恢复为 44px；44px 触控下限不得被误解为所有桌面控件都必须使用默认高度。桌面搜索宽度不超过 28rem，普通单项筛选为 10rem；筛选器禁止依赖无确定宽度的百分比布局而折叠。
- 控件、连续列表容器、高层面板圆角分别为 10、12、16px；全圆角只用于标签、状态点和明确的胶囊控件。
- 图标统一使用 Lucide 描边图标，根节点设置 `strokeWidth: 1.8`；同一层级不混用填充与描边图标。

## 层级与动效

- 层级只使用 `--z-dropdown`、`--z-sticky`、`--z-backdrop`、`--z-modal`、`--z-toast`。
- 时长只使用 100、150、200、320ms 令牌；列表 hover/focus 改变表面色，不抬升；输入用边框和焦点环；按钮用 Naive UI 状态层。
- 只动画 `opacity`、`transform` 及必要的遮罩；内容默认可见。`prefers-reduced-motion: reduce` 下取消位移并缩短到近乎即时。

## 例外与检查

前台展示应用可使用其独立品牌令牌，但不得反向污染后台主题。检查方式：搜索后台源码中的新 Hex、任意圆角、任意 z-index、任意 transition 时长；逐项证明已映射到本页令牌，否则不得合并。
