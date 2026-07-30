# 发布须知

> 仅维护者执行发布；本文不得记录凭据或内部地址。

## 版本

- 默认开发版本是最新 Git 发布标签的下一个补丁版本。
- 根 `package.json` 的 `version` 是机器可读来源；发布时须与 `package-lock.json`、`docs/changelog.md` 最新标题和 Git 标签一致。
- 每次代码改动记录到待发布版本的 `docs/changelog.md`。内部 workspace 不维护独立产品版本。
- 用户要求上传、发布或推送新版本时，交给 `.codex/agents/lostsky-git.toml` 定义的 `lostsky-git` 子代理；禁止移动标签、强制推送或重复发布已有版本。

## 发布前

- `package.json`、`package-lock.json`、`docs/changelog.md` 和标签版本一致。
- 数据变化同时更新 `sql/schema.sql` 和日期补丁。
- OpenAPI、生成类型、调用方、测试、文档和 `www/` 产物一致；涉及前端或文档源文件时必须运行生成命令。保留已有构建差异是指合并保留，不是跳过 `npm run build` 或 `npm run build:docs`。
- 运行并记录实际结果：

```bash
composer check-platform-reqs --no-dev
npm run test:backend
npm test
npm run typecheck
npm run check:media
npm run check:cors
npm run test:e2e
npm run build
npm run build:docs
git diff --check
```

## 发布

1. 审查并提交完整发布内容。
2. 创建附注标签：`git tag -a vX.Y.Z -m "LostSky vX.Y.Z"`。
3. 推送提交和标签，核对二者指向同一状态。
4. 备份数据库，应用补丁，使用 `composer install` 部署该标签的锁定依赖与构建产物。
5. 检查 API、登录、团队解析、前端资源、数据库结构和后台任务。

Git 推送只同步版本，不代替服务器部署。宝塔/Nginx、CDN 缓存和静态资源响应头按运维文档单独应用并验证。

## 失败

- 公开标签不移动；用新提交和新版本修复。
- 应用恢复到上一个已验证标签。
- 数据库依赖备份或前向修复；MySQL DDL 不保证整体回滚。
- 外部副作用使用幂等重试或补偿流程。
