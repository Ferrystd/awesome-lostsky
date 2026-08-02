# 代码更新清单

按改动类型勾选；不相关的项目无需运行。

## 每次代码改动

- [ ] 更新 `docs/changelog.md` 的“未发布”区，不修改已经发布的版本章节。
- [ ] 更新直接相关测试；输入、结构或示例变化时同步 fixture 和测试数据清理逻辑。
- [ ] 运行直接相关检查和 `git diff --check`，只记录实际结果。
- [ ] 不手改 `www/`、生成 API 类型或 Service 字典；涉及对应源文件时必须运行生成命令并保留生成差异。这里的“保留现有改动”仅指不得丢弃、回退或覆盖用户已有差异，不表示跳过生成。

## 联动清单

| 改动 | 一并维护 | 至少运行 |
| --- | --- | --- |
| PHP | 直接相关测试 | `php -l <文件>`、相关 PHP 测试 |
| 路由、请求或响应 | 路由、控制器/服务、OpenAPI、调用方、测试 | `php tests/openapi_routes.php`、相关测试 |
| Service public 方法 | `docs/glossary/service.md` | `php think docs:services`；只校验时使用 `--check` |
| 模型、字段、约束或数据语义 | 模型/验证器、`sql/schema.sql`、日期补丁、OpenAPI、fixture | 执行补丁并只读验证、相关集成测试 |
| 枚举或权限字典 | 枚举/`PermissionDictionary`、验证、OpenAPI、前端选项、权限文档、测试 | `php tests/permission_gate.php`、相关测试 |
| OpenAPI | `docs/openapi/*.json`、调用方、生成 API 类型 | `php tests/openapi_routes.php`、`npm run typecheck`（包含类型生成） |
| 前端源码或构建配置 | 前端测试、路由别名、`www/` | `npm test`、`npm run typecheck`、按需 `npm run test:e2e`、`npm run build` |
| 测试 fixture 或演示数据 | 创建、断言、清理逻辑及关联 schema | 直接使用该数据的测试 |
| 媒体 | `frontend/media/manifest.json`、来源或许可证 | `npm run check:media`、`npm run build` |
| CORS、域名或静态交付 | 路由/CORS 文档、Nginx 模板、调用方 | `npm run check:cors`、按需 `npm run test:e2e`、`npm run build` |
| npm 依赖 | `package.json`、`package-lock.json` | `npm ci`、受影响测试与构建 |
| Composer 依赖 | `composer.json`、`composer.lock` | `composer validate`、`composer check-platform-reqs`、相关测试 |
| Wiki/文档 | 正文、链接；新增、改名或删除时同步 `zensical.toml` | `npm run build:docs` |
| 文档站依赖 | `docs/requirements.txt` | `npm run docs:setup`、`npm run build:docs` |
| 配置或部署模板 | `.env.example`、`deploy/`、运维文档 | 对应检查与部署验证 |

## 发布时

按[发布须知](releasing.md)统一核对版本、锁文件、Changelog、生成物、全量测试和构建。

- 产品版本发布：更新版本文件，将“未发布”内容固化为 `vX.Y.Z`，同步 `docs/updates.md` 并创建同名附注标签。
- 产品预发布：版本文件更新为 `X.Y.Z-stage.N`，保留目标正式版本的“未发布”日志，不滚动 `docs/updates.md`，并创建同名 `vX.Y.Z-stage.N` 附注标签。
- 构建发布：产品版本文件保持不变，保留“未发布”日志并创建唯一的 `build-YYYYMMDD.N` 附注标签。
