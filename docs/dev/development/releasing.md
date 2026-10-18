# 发布须知

> 仅维护者执行发布；本文不得记录凭据或内部地址。

## 发布标识

- 根 `package.json` 的 `version` 是当前公开产品版本的机器可读来源，并与 `package-lock.json` 一致；内部 workspace 不维护独立产品版本。
- 日常代码改动记录到 `docs/dev/changelog.md` 的“未发布”区，不得追加到已经发布的版本章节。
- 产品版本发布使用附注标签 `vX.Y.Z`：更新两个版本文件，将“未发布”内容固化为对应版本，并同步 `docs/dev/updates.md`。
- 下一产品版本的预发布使用 `vX.Y.Z-alpha.N`、`vX.Y.Z-beta.N` 或 `vX.Y.Z-rc.N`：版本文件与标签使用完整预发布版本，“未发布”日志注明目标正式版本，但不滚动 `docs/dev/updates.md`；未指定阶段时默认 beta。
- 不增加公开版本号的临时交付使用附注标签 `build-YYYYMMDD.N`：产品版本文件保持不变，日期按 Asia/Shanghai 计算，序号在当天从 1 递增。
- 产品标签和构建标签都是不可变交付物标识；部署与回滚同时记录标签及其 commit SHA。
- 用户要求上传、发布或推送交付物时，交给 `.codex/agents/lostsky-git.toml` 定义的 `lostsky-git` 子代理；禁止移动标签、强制推送或重复发布已有标识。

## Changelog

`docs/dev/changelog.md` 是面向用户的结果索引，不是实现报告：

- 只写已经完成且用户或运维者可观察的结果；纯内部重构、测试、文件清单和开发过程不单独成条，除非影响兼容性、安全、迁移或部署。
- 同一用户目标及其后续调整合并为一条，只保留最终结果；一次任务原则上新增一条，确有互不相关的结果才拆分。
- 每条只写一个句子，先写结果，再补必要边界；正文原则上不超过 60 个汉字，必要的命令、版本和公开标识不计入。
- 每个版本原则上保留最高 15 条；超过 15 条时先按用户目标合并，并将实现细节移入提交或开发专题文档。
- 不罗列文件、类、接口或测试数量；实现细节归入提交、OpenAPI 或开发专题文档。用户手册由人工维护，AI 只报告待更新差异，见[文档维护归属](wiki.md)。
- 发布前合并重复项并删除中间过程，只按最终性质归入“新增”“变更”或“修复”。

## 发布前

- `package.json` 与 `package-lock.json` 的产品版本一致；产品版本发布还须与固化后的 Changelog 标题和 `vX.Y.Z` 标签一致。
- 预发布须从最新稳定产品标签推导目标版本，确认完整预发布标签未被使用，并保持版本文件与 `vX.Y.Z-stage.N` 标签一致。
- 构建发布须保留“未发布”日志，确认对应产品标签存在、发布提交是其后代，且 `build-YYYYMMDD.N` 在本地与远端均未被使用。
- 数据变化同时更新 `sql/schema.sql` 和日期补丁。
- OpenAPI、生成类型、调用方、测试和文档一致；按[联动清单](checklist.md#change-coupling)运行受影响的生成命令，字典维护遵守[文档归属与失败处理](wiki.md)。普通 Markdown 编辑不要求重生成 API 类型或字典。`www/` 可再生产物不纳入 Git，但发布前必须完成 `npm run build` 与 `npm run build:docs` 并确认入口和资源目录存在。
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

1. 审查并提交完整发布源码、文档和受跟踪生成物；不提交 `www/` 可再生产物。
2. 产品版本发布创建 `git tag -a vX.Y.Z -m "LostSky vX.Y.Z"`；预发布创建 `git tag -a vX.Y.Z-stage.N -m "LostSky vX.Y.Z-stage.N"`；构建发布创建 `git tag -a build-YYYYMMDD.N -m "LostSky build YYYYMMDD.N (product vX.Y.Z)"`。
3. 推送提交和本次唯一标签，核对远端标签的 peeled commit 与分支目标。
4. 发布机在独立目录检出该不可变标签，先运行 `composer install --no-dev --prefer-dist --no-interaction` 安装锁定 PHP 依赖，再执行 `npm ci`、`npm run docs:setup`、`npm run build`、`npm run build:docs`；文档构建会调用 PHP 的 Service 字典检查，不能放在 Composer 安装之前。确认完整 `www/` 后，按[部署指南](../operations/deployment.md)备份数据库、应用适用的增量补丁、切换发布目录并重启后台进程。
5. 记录标签、commit SHA、环境、时间、执行人和结果，再检查 API、登录、团队解析、前端资源、数据库结构和后台任务。

Git 推送只同步版本，不代替服务器部署。宝塔/Nginx、CDN 缓存和静态资源响应头按运维文档单独应用并验证。

首个 `1.0.0` 版本的宝塔部署采用[官方通道流程](../operations/bt-panel.md)：项目内固定版本的官方 `btpanel` Skill 配合官方 MCP，面板 API 为兼容通道。先确认目标和只读盘点，再按已授权范围部署；异步任务完成后写后复核，生产环境验收与源码发布分别记录。

## 失败

- 产品标签和构建标签均不移动；使用新提交及新的产品版本或构建标识修复。
- 应用恢复到上一个已验证的产品标签或构建标签。
- 数据库依赖备份或前向修复；MySQL DDL 不保证整体回滚。
- 外部副作用使用幂等重试或补偿流程。

## 真实发布集成验收

常规单测与部署验收分别记录。下列入口默认不发送短信或微博帖子，外部探针必须显式选择；不得把本地通过写成生产部署通过。

```bash
php tests/release_schema.php
php tests/release_http_db.php
php tests/http_transport.php
php tests/release_external.php --oss
php tests/release_external.php --webhook
python tests/release_realtime.py --realtime
```

- 全新库入口仅接受本地 debug 与回环 MySQL，登记随机 `lostsky_release_probe_<nonce>` 清理 manifest，拒绝 schema 中的目标库切换指令；逐条初始化前确认当前库为本次库，核对完整表/外键列及引擎、排序规则、管理员角色种子，再在新库运行外键回归。结束只 DROP 本次随机库并确认不存在，不访问原业务库，也不执行历史补丁。
- HTTP→DB 入口仅接受 `APP_DEBUG=true`、MySQL `127.0.0.1` 和数据库名 `lostsky`。它启动临时回环 PHP HTTP 服务，使用随机自建用户、团队、商品和权益，验证登录、身份领取、购买、记账、核销和设备退出，结束后清理本次关联数据与进程。运行中的临时 manifest 只记录清理所需 ID；异常清理失败须保留现场，不得批量删除其他记录。
- HTTP transport 入口启动独立回环响应服务，覆盖真实成功、错误响应和错误后继续请求；它不调用微博网络。
- OSS 入口使用配置中的真实 OSS，仅操作 `release-probes/release-{随机标识}/object.txt`，校验 put/get/head/delete 与删除后不存在；清理失败返回非零，不得作为通过结果。
- Webhook 入口向 `https://httpbin.org/post` 发送随机非敏感 fixture 和一次性签名，验证真实 HTTPS 请求、响应正文及签名头传输。这是公开 echo 组件验收，未验证用户接收端的签名校验、业务处理或生产投递。
- 实时入口需要 Python 与 `websockets`（验收使用 13.1），通过进程管道读取当前 PHP 配置，不落盘令牌，使用独立随机 subject/channel 验证真实 WebSocket 连接、订阅、publication 与业务 disconnect。它不访问其他人的会话；该结果与 HTTP→DB 设备撤销结果分别记录，不能推断生产反向代理已通过。

报告必须附源码 SHA、环境、命令和结果。生产 SSH 必须使用严格 host key 核验；主机指纹变化时先经可信渠道确认。生产备份、恢复、scheduler/worker、反向代理、受控短信收件人和实际 Webhook 接收端尚未验收时，分别标为未验证。短信 `SchemeName` 留空使用阿里云默认方案，不能仅因留空判为缺配置；发送与核验应使用同一方案。
