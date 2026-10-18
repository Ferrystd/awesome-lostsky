# 代码更新清单

按当前任务的改动类型勾选；不相关的项目无需运行，工作区已有差异不自动计入当前任务。测试范围及扩大条件以[测试须知](testing.md)为准。

## 每次改动

- [ ] 核对工作区与暂存区已有差异，按[工作区保护与阶段性暂存](contributing.md#staged-worktree-baseline)只纳入当前任务已验证的改动。
- [ ] 核验并同步直接相关开发正文、索引与链接；人工手册只读参考，需要人工更新的页面和差异按[文档维护归属](wiki.md)报告。
- [ ] 符合[Changelog 范围](releasing.md#changelog)的用户或运维结果已记入“未发布”区；纯文档整理、内部重构和测试不单独成条，不改写已发布章节。
- [ ] 输入、结构或行为变化已维护直接相关测试、fixture 与清理逻辑，并按[测试须知](testing.md)记录实际命令和结果。
- [ ] 生成内容从对应源更新，未手改 API 类型或字典；`www/` 可再生产物只用于构建验证和部署，不纳入 Git。

## 前端结构与交互

页面改动按[后台前端完成定义](../design/admin/checklist.md)逐项验收，本页不重复维护细则。重点入口：

- [页面组件化与封闭契约](../design/admin/componentization.md)：实施前盘点、抽象阈值、唯一视觉所有者、全部同义用法迁移和旧 CSS 清理。
- [保存边界与草稿保护](../design/admin/componentization.md#draft-boundary)：一个业务分组一次原子提交、脏草稿保护和离开提示。
- [前端约定](frontend.md)：数字空值、候选缓存更新、查询状态与公共原语。
- [组件封闭契约测试](testing.md#component-contract-testing)：源码守卫、桌面和移动端几何断言；用户截图中的具体关系必须转成回归断言。
- [组件代码预览](component-previews.md)：真实代码渲染附件仅供人类查看，不替代自动化验收。

<a id="change-coupling"></a>

## 联动清单

| 改动 | 一并维护 | 至少运行 |
| --- | --- | --- |
| PHP | 直接相关测试 | `php -l <文件>`、相关 PHP 测试 |
| 路由、请求或响应 | 路由、控制器/服务、OpenAPI、调用方、测试 | `php tests/openapi_routes.php`、相关测试 |
| Service public 方法 | `docs/dev/glossary/service.md` | `php think docs:services`；只校验时使用 `--check` |
| 权限定义或字典模板 | 开发侧与用户侧权限字典、Service 字典 | `npm run generate:docs`、`php tests/dictionary_docs.php`；用户侧仅自动生成 `docs/user/dictionary/permissions.md` |
| 模型、字段、约束或数据语义 | 模型/验证器、`sql/schema.sql`、日期补丁、OpenAPI、fixture | 执行补丁并只读验证、相关集成测试 |
| 枚举或权限字典 | 枚举/`PermissionDictionary`、验证、OpenAPI、前端选项、权限文档、测试 | `php tests/permission_gate.php`、相关测试 |
| OpenAPI | `docs/dev/openapi/*.json`、调用方、生成 API 类型 | `php tests/openapi_routes.php`、`npm run typecheck`（包含类型生成） |
| 前端源码或构建配置 | 前端测试、路由别名、`www/` 构建验证 | 按[测试须知](testing.md)运行受影响 Vitest/E2E 用例、`npm run typecheck`、`npm run build`；全量测试仅在扩大条件满足时运行 |
| 测试 fixture 或演示数据 | 创建、断言、清理逻辑及关联 schema | 直接使用该数据的测试 |
| 媒体 | `frontend/media/manifest.json`、来源或许可证 | `npm run check:media`、`npm run build` |
| CORS、域名或静态交付 | 路由/CORS 文档、Nginx 模板、调用方 | `npm run check:cors`、按需 `npm run test:e2e`、`npm run build` |
| npm 依赖 | `package.json`、`package-lock.json` | `npm ci`、受影响测试与构建 |
| Composer 依赖 | `composer.json`、`composer.lock` | `composer validate`、`composer check-platform-reqs`、相关测试 |
| Wiki/文档 | 按[文档管理方法](wiki.md)核验事实与生命周期；按实际变化同步正文、链接、索引和站点配置 | 按测试须知判断；普通文字修改检查差异，站点契约或发布验证运行 `npm run build:docs` |
| 文档站依赖 | `docs/dev/requirements.txt` | `npm run docs:setup`、`npm run build:docs` |
| 配置或部署模板 | `.env.example`、`deploy/`、运维文档 | 对应检查与部署验证 |

## 发布时

按[发布须知](releasing.md)统一核对版本、锁文件、Changelog、受跟踪生成物、全量测试和本地静态构建。

- 产品版本发布：更新版本文件，将“未发布”内容固化为 `vX.Y.Z`，同步 `docs/dev/updates.md` 并创建同名附注标签。
- 产品预发布：版本文件更新为 `X.Y.Z-stage.N`，保留目标正式版本的“未发布”日志，不滚动 `docs/dev/updates.md`，并创建同名 `vX.Y.Z-stage.N` 附注标签。
- 构建发布：产品版本文件保持不变，保留“未发布”日志并创建唯一的 `build-YYYYMMDD.N` 附注标签。
