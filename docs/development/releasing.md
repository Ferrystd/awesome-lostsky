# 发布须知

> 仅维护者执行发布；本文不得记录凭据或内部地址。

## 发布标识

- 根 `package.json` 的 `version` 是当前公开产品版本的机器可读来源，并与 `package-lock.json` 一致；内部 workspace 不维护独立产品版本。
- 日常代码改动记录到 `docs/changelog.md` 的“未发布”区，不得追加到已经发布的版本章节。
- 产品版本发布使用附注标签 `vX.Y.Z`：更新两个版本文件，将“未发布”内容固化为对应版本，并同步 `docs/updates.md`。
- 下一产品版本的预发布使用 `vX.Y.Z-alpha.N`、`vX.Y.Z-beta.N` 或 `vX.Y.Z-rc.N`：版本文件与标签使用完整预发布版本，“未发布”日志注明目标正式版本，但不滚动 `docs/updates.md`；未指定阶段时默认 beta。
- 不增加公开版本号的临时交付使用附注标签 `build-YYYYMMDD.N`：产品版本文件保持不变，日期按 Asia/Shanghai 计算，序号在当天从 1 递增。
- 产品标签和构建标签都是不可变交付物标识；部署与回滚同时记录标签及其 commit SHA。
- 用户要求上传、发布或推送交付物时，交给 `.codex/agents/lostsky-git.toml` 定义的 `lostsky-git` 子代理；禁止移动标签、强制推送或重复发布已有标识。

## 发布前

- `package.json` 与 `package-lock.json` 的产品版本一致；产品版本发布还须与固化后的 Changelog 标题和 `vX.Y.Z` 标签一致。
- 预发布须从最新稳定产品标签推导目标版本，确认完整预发布标签未被使用，并保持版本文件与 `vX.Y.Z-stage.N` 标签一致。
- 构建发布须保留“未发布”日志，确认对应产品标签存在、发布提交是其后代，且 `build-YYYYMMDD.N` 在本地与远端均未被使用。
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
2. 产品版本发布创建 `git tag -a vX.Y.Z -m "LostSky vX.Y.Z"`；预发布创建 `git tag -a vX.Y.Z-stage.N -m "LostSky vX.Y.Z-stage.N"`；构建发布创建 `git tag -a build-YYYYMMDD.N -m "LostSky build YYYYMMDD.N (product vX.Y.Z)"`。
3. 推送提交和本次唯一标签，核对远端标签的 peeled commit 与分支目标。
4. 备份数据库，应用补丁，使用 `composer install` 部署该不可变标签的锁定依赖与构建产物。
5. 记录标签、commit SHA、环境、时间、执行人和结果，再检查 API、登录、团队解析、前端资源、数据库结构和后台任务。

Git 推送只同步版本，不代替服务器部署。宝塔/Nginx、CDN 缓存和静态资源响应头按运维文档单独应用并验证。

## 失败

- 产品标签和构建标签均不移动；使用新提交及新的产品版本或构建标识修复。
- 应用恢复到上一个已验证的产品标签或构建标签。
- 数据库依赖备份或前向修复；MySQL DDL 不保证整体回滚。
- 外部副作用使用幂等重试或补偿流程。
