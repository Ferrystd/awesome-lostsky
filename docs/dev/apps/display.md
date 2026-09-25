# Display 应用

Display 提供团队公开主页、可展示实体详情和公开文档。入口为
`https://{teamSlug}.display.lostsky.work/`，请求需要能够从域名确定有效团队，但不要求用户登录。

## 业务职责

- 返回团队 Profile、介绍媒体、Markdown、Public 字段、主页展示文案和 Public 文档。
- 分页返回 `entity.is_displayed = 1` 的有效成员与虚拟实体。
- 公开实体目录支持按资料名称或全局 Slug 模糊搜索，并可与成员、虚拟实体类型筛选及分页组合。
- 返回单个公开实体的 Profile、Public 字段、公开角色和 Public 文档。
- 解析公开 Markdown 中的 Entity 引用，并生成所属团队的 Display 链接。

顾客实体永不进入 Display。公开字段只输出 `key/name/value_type/value/options`，
不暴露管理范围、可见目标、搜索设置等内部配置。公开状态与实体搜索及 Chat 可用性相互独立。
团队主页只取决于团队是否有效，不由实体展示开关控制。

角色由 `team_role.is_displayed` 独立决定是否公开。只有已经分配给公开实体且开启该开关的角色
会按 `sort ASC, id ASC` 输出；公开结构仅包含 `name/description`，不暴露角色标识、权限或绑定记录。

## 鉴权边界

- 不经过 `JwtAuth`、`Context` 或成员访问中间件。
- 团队由全局应用解析和路由流程写入请求上下文。
- 数据可见性由 `Display` 服务统一控制。
- 私有文档、跨团队文档和归属隐藏或无效实体的文档统一返回 404，避免通过文档 ID 判断资源是否存在。

## 前端边界

- Display 使用统一的 LostSky 深空青色模板，不接受团队主题或联系方式配置。
- 团队主页首屏欢迎语回退、实体入口、实体区域标题、说明和空状态文案来自 `display.*` TeamSetting；独立实体目录不读取这些主页专属文案。
- `/entities` 提供完整公开实体目录；团队主页只保留桌面最多三行、移动端最多三个对象的预览。本期不在导航或主页增加该独立目录入口。
- 实体详情复用 Profile 现有 `intro_image` 作为唯一的全宽 Hero 背景，在固定高度容器内以 `cover` 居中裁剪；该页不再叠加站点背景，同一图片也不在正文媒体区重复渲染。
- 公开文档继续通过共享 `LsMarkdownRenderer` 使用 `marked` 与 DOMPurify 安全渲染；Milkdown/Crepe 只用于后台编辑。文档阅读页为标题、列表、引用、代码、表格和媒体提供独立排版层级。
- Markdown Entity 引用使用统一的展开式资料卡；再次点击同一引用会收起。共享组件识别团队、成员、顾客和虚拟实体，但 Display 解析仍不公开顾客资料，顾客引用只显示不可用状态。
- 首版只读，不提供加入申请、聊天动作、自定义域名、SEO、SSR 或预渲染。
- Markdown 继续经过 DOMPurify；图片声明尺寸并延迟加载，视频仅允许访客手动播放。
- 首页 Hero 的光球只属于装饰层，必须由 `.hero-visual` 使用 `overflow: clip` 限制在视觉容器内，不得扩大页面可滚动宽度或获得辅助技术语义。桌面与 320px 起的移动端均保持人物图可见；`prefers-reduced-motion` 下停止光球动画。该装饰无加载、错误、权限或能力状态，也无页面例外。检查方法：Playwright 在 320、375、768、1024、1440px 断言页面无横向溢出，并在减少动态效果下断言动画关闭。

## 接口契约

具体路径、查询参数和响应结构见 [`display.openapi.json`](../openapi/display.openapi.json)。
