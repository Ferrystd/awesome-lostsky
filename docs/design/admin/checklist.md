# 后台前端完成定义

## 设计与 Wiki

- [ ] 修改前已阅读本板块及应用条目。
- [ ] 每个新增组件参数、页面约束、例外和用户可见状态都有唯一 Wiki 正文。
- [ ] 规则包含范围、必须/禁止、组件/令牌、响应式/无障碍、状态/权限、例外和检查方法。
- [ ] 未引入 PrimeVue、复制 shadcn-vue 或页面私有控件体系。

## 实现

- [ ] 应用根部统一 Naive UI 2.44.1、zhCN、LostSky 主题和 Lucide 1.8 描边，页面无主题 Provider。
- [ ] 页面使用公共标题、工具栏、主体、动作、上传和异步状态组件。
- [ ] 集合页有搜索、必要筛选、结果数量、连续边界和统一分页。
- [ ] 桌面动作图标+文字；移动端一个主操作+更多；同组同尺寸且每区域最多一个主操作。
- [ ] 缺权限/能力不发请求、不在加载时误报；4xx 不重试；真实错误不清空壳层。

## 测试、手册与发布

- [ ] Vitest 覆盖主题、标题、工具栏、主体、响应式动作、上传、异步状态和权限禁用。
- [ ] Transaction 覆盖缺失/空 `customers/entities` 及失败响应，`/new` 无控制台异常。
- [ ] Playwright 覆盖集合页、桌面/移动动作、不越权不误报、无刷新/重试按钮和 320—1440px。
- [ ] 键盘、焦点、200% 文本、44px 触控区和减少动态通过。
- [ ] 用户可见行为已同步使用手册与 Changelog。
- [ ] 运行 `npm test`、`npm run typecheck`、`npm run test:e2e`、`npm run test:e2e:admin`、`npm run build:docs`、`npm run build`、`git diff --check`，保留生成的 `www/` 差异。

## 可执行静态守卫

- `npm test` 必须扫描五个后台应用和 `@lostsky/ui`：除根 `App.vue` 外不得出现 `NConfigProvider`；除[公共组件中登记的实现级例外](components.md)外不得出现原生标准控件。
- `npm test` 必须断言后台源码不导入 PrimeVue、shadcn-vue，也不出现可见“刷新”“重试”“重新检查”按钮；令牌刷新、重新登录等具名业务动作不在此禁令内。
- `npm test` 必须断言本板块八个页面都存在、导航可达，并检查公共组件新增参数已登记；不能用仅通过构建代替 Wiki 完整性检查。
- `npm run typecheck` 验证共享组件事件和 Naive UI 参数；`npm run build` 是完整静态发布构建，生成的 `www/` 必须纳入同一变更供发布审查。
- Playwright 在 320、375、768、1024、1440px 检查 `document.documentElement.scrollWidth <= clientWidth`，并验证桌面动作带文字、移动端为“主操作 + 更多/操作”、触控区不少于 44px、权限禁用不发请求。
