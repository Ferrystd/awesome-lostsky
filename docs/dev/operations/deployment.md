# 部署指南

本文说明 LostSky 的生产部署流程。开发环境准备见[开发须知](../development/development.md)，版本发布与恢复见[发布须知](../development/releasing.md)。

首个 `1.0.0` 版本优先通过[宝塔官方 MCP 与 Skill](bt-panel.md)完成面板资源盘点、部署和写后验收；无法使用 MCP 时采用对应版本的官方面板 API。下文的运行时、目录、构建、Nginx 与业务验收要求同样适用。

## 环境要求

- PHP 8.1+
- MySQL 5.7+ 或 MariaDB 10.3+
- Composer 2
- Node.js LTS 与 npm
- Python 3.12+（构建文档站）

## 交付物身份

- 生产或预发布环境必须指定不可变的正式标签 `vX.Y.Z`、预发布标签 `vX.Y.Z-stage.N` 或构建标签 `build-YYYYMMDD.N`，不得以会继续移动的分支名作为部署身份。
- 部署记录须保存目标标签、peeled commit SHA、环境、时间、执行人和结果；同一产品版本下的不同构建不得只记录 `X.Y.Z`。
- 构建目录、备份和回滚记录使用完整标签或 commit SHA，避免同一产品版本的多个构建互相覆盖。
- `php think version` 显示 ThinkPHP 框架版本，不能作为 LostSky 交付物身份；发布目录中使用以下命令核对实际代码：

  ```bash
  git describe --tags --always
  git rev-parse HEAD
  ```

部署前将 PHP 目录加入 `PATH`，确保终端可以直接执行 `php` 和 `composer`。Windows PowerShell 示例：

```powershell
$phpDir = "你的 PHP 安装目录"
$composerPhar = Join-Path $phpDir "composer.phar"
$composerBat = Join-Path $phpDir "composer.bat"
Set-Content -Path $composerBat -Value "@echo off`r`n`"$phpDir\php.exe`" `"$composerPhar`" %*" -Encoding ASCII

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if (($machinePath -split ";") -notcontains $phpDir) {
    [Environment]::SetEnvironmentVariable("Path", "$machinePath;$phpDir", "Machine")
}
```

重新打开终端后确认：

```bash
php -v
composer --version
```

## 后端部署

1. 安装生产依赖：

   ```bash
   composer install --no-dev --prefer-dist --no-interaction
   ```

2. 从模板创建 `.env`，再按目标环境配置数据库、域名、JWT 和 OSS 等参数：

   ```bash
   cp .env.example .env
   ```

   为应用运行日志配置 PHP-FPM 可写且不对外公开的目录；完整字段、结构和查询方法见[系统运行日志](logging.md)：

   ```ini
   LOG_PATH=/var/log/lostsky
   LOG_MAX_FILES=30
   LOG_FILE_SIZE=10485760
   LOG_CLOSE=false
   ```

3. 在 `.env` 中配置阿里云 AccessKey：

   ```ini
   ALIYUN_ACCESS_KEY_ID=你的AccessKeyID
   ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret
   ```

   OSS 自定义域名使用 Let’s Encrypt 证书时，同时配置 Bucket、地域和域名：

   ```ini
   ALIYUN_OSS_BUCKET=你的Bucket
   ALIYUN_OSS_REGION=cn-hangzhou
   ALIYUN_OSS_DOMAIN=https://oss.lostsky.work
   ```

   所有前端、API 和 OSS 域名共用一张多 SAN 通配符证书：

   ```ini
   TLS_CERTIFICATE_PATH=/etc/letsencrypt/live/lostsky.work/fullchain.pem
   TLS_PRIVATE_KEY_PATH=/etc/letsencrypt/live/lostsky.work/privkey.pem
   TLS_NGINX_BINARY=/www/server/nginx/sbin/nginx
   ```

   RAM 身份至少需要 `oss:PutCname` 以及证书托管所需的 `yundun-cert:DescribeSSLCertificatePrivateKey`、`yundun-cert:DescribeSSLCertificatePublicKeyDetail`、`yundun-cert:CreateSSLCertificate`。首次配置并确认域名已经绑定到 Bucket 后，执行 `php think certificate:update`；完整 SAN 清单和 Certbot deploy hook 见[控制台命令](console.md)。

   短信类型、验证码策略、签名和模板统一写在 `config/auth.php`，不通过环境变量选择。默认使用阿里云短信服务：

   ```php
   use app\enum\SmsType;

   'type' => SmsType::AliyunSms,
   'aliyun_sms' => [
       'sign_name' => '已审核短信签名',
       'template_code' => '已审核验证码模板Code',
   ],
   ```

   若改用号码认证服务的短信认证，将类型改为 `SmsType::AliyunPnvsSms`，并填写 `aliyun_pnvs_sms` 下的方案、签名和模板。两个通道是不同的阿里云产品和 API 权限。RAM 身份需要按所选通道分别授予短信服务 `SendSms`，或号码认证服务 `SendSmsVerifyCode`、`CheckSmsVerifyCode` 的最小权限。号码认证配置使用短信认证，不使用融合认证或一键取号。

   生产环境必须保持 `.env` 中：

   ```ini
   APP_DEBUG=false
   ```

   并保持 `config/auth.php` 中 `sms.debug_bypass=false`。本地开发如需跳过短信，仅在 `APP_DEBUG=true` 时将该配置改为 `true`。该模式不会发送短信，并接受任意验证码输入。

   PHP 上传临时目录必须存在、可写，并且生产环境不得把启动 Notice 写入 API 响应正文。项目提供 [`deploy/php/lostsky-production.ini`](../../deploy/php/lostsky-production.ini)；将其安装到 PHP-FPM 的 `conf.d` 目录，或把同样配置写入 FPM 实际加载的 `php.ini`：

   ```ini
   upload_tmp_dir=/var/lib/lostsky/upload-tmp
   display_errors=Off
   display_startup_errors=Off
   log_errors=On
   error_log=/var/log/php/lostsky-error.log
   ```

   创建目录后将所有者设置为 PHP-FPM 运行用户，并通过 `phpinfo()` 或 FPM 配置检查实际加载的 `php.ini`。上线冒烟测试应上传一个小文件，确认 HTTP `Content-Type` 为 `application/json`、响应可被 JSON 解析，且正文开头不存在 `<br>`、`Notice` 或 PHP 警告。

4. 初始化与升级分开处理：新建空库导入当前 `sql/schema.sql`；已有数据库先备份，再对照当前结构、已执行补丁和目标标签，只应用尚未执行且适用于该结构的 `sql/patches/` 补丁。不得对已有库重新导入完整 Schema，也不得在最新 Schema 上无差别重放历史补丁；MySQL DDL 不保证事务回滚。保存本次实际补丁清单，并只读核对列、索引与约束。
5. 清理框架缓存：

   ```bash
   php think clear
   ```

6. 将 API 站点运行目录指向项目的 `public/`，不要指向项目根目录。

ThinkPHP 站点使用以下 Nginx 规则：

```nginx
listen 80;
listen 443 ssl;
server_name api.lostsky.work;
ssl_certificate /etc/letsencrypt/live/lostsky.work/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/lostsky.work/privkey.pem;

location / {
    if (!-e $request_filename) {
        rewrite ^(.*)$ /index.php?s=$1 last;
        break;
    }
}
```

### Ability 到期 Database Worker

依赖、配置和数据库就绪后，为已有有限期 Grant 执行一次 `php think ability:expiration:backfill`，再由 Supervisor 常驻消费独立队列。已有库升级时按实际结构检查 `sql/patches/20260812_shop_ability_expiration.sql`；新建库使用当前 Schema，不重放历史建表补丁。

```ini
[program:lostsky-ability-expiration]
command=php /www/deploy/lostsky/think queue:work database --queue=ability-expiration --sleep=2 --tries=0 --timeout=110
directory=/www/deploy/lostsky
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/lostsky/ability-expiration-worker.log
stopwaitsecs=120
```

队列使用业务数据库的 `jobs` 表。部署新代码后执行 `php think queue:restart`，并确认 Supervisor 中进程为 `RUNNING`。公开商城接口始终实时校验 Shop Ability，因此 Worker 延迟不会继续展示或销售商品。

### Weibo Database Worker

开启/恢复与下一周期投递使用业务事务内的 `jobs` 插入；必须保留 `queue.connections.database.connection = null`，`jobs` 与业务表使用同一数据库的 InnoDB 事务。入队失败不提交 Active 或新的 plannedAt，当前 Job 保留供 Worker 重试；已有操作日志阻止远端重写。

已有库按升级起点检查 `sql/patches/20260825_weibo_application.sql` 与 `sql/patches/20260826_weibo_checkin_tasks.sql`；新建库直接使用当前 Schema，不重放历史补丁。依赖、配置和数据库就绪后，两类任务共用单独的 Supervisor 进程和 `weibo-schedule` 队列：

```ini
[program:lostsky-weibo]
command=php /www/deploy/lostsky/think queue:work database --queue=weibo-schedule --sleep=2 --tries=0 --timeout=110
directory=/www/deploy/lostsky
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/lostsky/weibo-worker.log
stopwaitsecs=120
```

该 Worker 使用 `--tries=0`，未捕获异常会由队列继续重试；任务代码对已获得远端结果或远端结果不明的情况会落库并删除当前 Job，不应人工重发同一写操作。每次执行重新校验 Weibo Ability；缺失时不访问微博写接口。每日签到会在请求前按当天调度日志去重，失败也只在次日再次执行。部署后重启队列并确认 `lostsky-weibo` 为 `RUNNING`。

部署并重启 Worker 后执行 `php think weibo:tasks-recover`，并由服务器调度器每分钟执行一次该命令；它输出 `enqueued` 计数，只为缺失 Job 的 Active 任务补投原 dispatch key，不重投已有待执行或已领取 Job。用于历史缺口和异常清除 Job 后的恢复，不直接调用微博写接口。远端结果不明仍由 Worker 转 unknown 后进入下一周期。命令不会自动安装计划任务，必须核验目标环境的定时调度与消费者。

<a id="weibo-feed-polling"></a>

### 微博点单信息流采集

信息流采集与 `weibo-schedule` 写操作队列相互独立。已有库执行 `sql/patches/20260922_weibo_feed.sql`（新建库直接使用当前 Schema）。分类使用常驻本地 Python 服务，不再需要 TypeSafe 密钥；按 `.env.example` 和 `config/weibo_feed.php` 配置本地服务、关键词、轮询上限与显示窗口。

部署时保留全部训练、测试、人工复核和权重产物；第三轮模型根目录需包含原 `model-lock.json` 及 `model-2e-5/` 中的配置、权重和分词器。权重文件 SHA-256 为 `39ae921da06ce92e41519745a3f6f96e8055f439cbe03f754098a2cb7f6b2a57`，运行资产身份由 `scripts/weibo_feed_classifier/model-manifest.json` 绑定。模型资产位于忽略目录，Git 代码提交不包含权重或训练样本；迁移机器时必须另行完整复制并保留原数据。服务启动只读取本地文件，不从模型仓库下载。

项目根目录下启动本地服务（Linux 将 Python 路径替换为对应虚拟环境）：

```powershell
runtime/feed-training-20260929/.venv/Scripts/python.exe scripts/weibo_feed_classifier/server.py --model-root runtime/feed-training-round3-20260930 --host 127.0.0.1 --port 8765 --threads 4 --inference-batch-size 16 --max-request-batch 100
```

依赖和服务协议见 `scripts/weibo_feed_classifier/README.md`。使用系统服务管理器保持进程常驻，并在重启后恢复；仅绑定环回地址，不公开暴露推理端口。先读取 `http://127.0.0.1:8765/health` 确认模型、阈值、预处理和分词器身份，再启动采集。

| 配置 | 默认值与用途 |
| --- | --- |
| `WEIBO_FEED_CLASSIFIER_URL` | `http://127.0.0.1:8765/classify`，本地批量推理地址 |
| `WEIBO_FEED_CLASSIFIER_TIMEOUT` | `180`，本地批量推理超时秒数 |
| `WEIBO_FEED_CLASSIFIER_BATCH_SIZE` | `100`，每次推理请求上限 |
| `WEIBO_FEED_CLASSIFIER_MODEL` | `weibo-feed-macbert-round3`，与服务 manifest 一致 |
| `WEIBO_FEED_CLASSIFIER_MODEL_SHA256` | 固定第三轮权重的 SHA-256 |
| `WEIBO_FEED_CLASSIFIER_MAX_LENGTH` | `160`，与冻结训练规则一致 |
| `WEIBO_FEED_CLASSIFIER_PREPROCESS_VERSION` | `remove-first-leading-supertopic-v1` |
| `WEIBO_FEED_CLASSIFIER_PREPROCESS_FINGERPRINT` | 与运行 manifest 一致的预处理指纹 |
| `WEIBO_FEED_KEYWORDS` | 英文逗号分隔；以当前项目配置与环境变量为准 |
| `WEIBO_FEED_RETENTION_SECONDS` | `86400`，采集和显示最近一天；不删除数据库历史记录 |
| `WEIBO_FEED_BATCH_LIMIT` | `100`，单轮处理上限 |
| `WEIBO_FEED_MAX_PAGES` | `5`，每个关键词有限扫描页数 |
| `WEIBO_FEED_CLASSIFICATION_RETRIES` | `3`，判定异常的有限尝试次数 |
| `WEIBO_FEED_INTENT_THRESHOLD` | `0.46`，包含边界值；必须与锁定模型阈值一致 |
| `WEIBO_FEED_REQUEST_TIMEOUT` | `15`，单次微博搜索请求超时秒数 |

```bash
php think weibo:feed-poll
```

确认搜索、实际模型调用和数据库落盘结果后，由服务器定时调度每分钟执行一次同一命令。命令只采集与判定，不发送评论；前端的定期读取也不会启动搜索或模型调用。数据库迁移、离线测试与静态构建均不等于采集服务已经启用。本地模型故障或身份不匹配保留 Failed 并有限重试，不作为负面意图结果，也不自动回退 Jev。已有已分类记录保留原判定、原模型身份和分数，不自动重判；所有正文及历史记录继续保存。

匿名接口会受远端可用性、限流与风控影响，有限页数扫描也不能保证覆盖全站每条微博。检查命令结果、最近成功更新时间与有效帖子数量；不记录 Cookie、密钥、完整外部响应或账户凭据。已发布的定时任务与本地 Codex 自动化不是同一调度系统。

### OSS 统一缺图

原始占位图保存在 `deploy/oss/system/image-not-found.png`，固定对象键为 `system/image-not-found.png`。`system/` 是系统保留前缀：不得通过团队文件上传、删除或清理流程管理，也不写入 `file` 表或团队配额。部署并回读校验原始字节：

```bash
php think oss:fallback:deploy
```

命令锁定 SHA-256 `c7867513080c061235f9be90bab875c19883a0fe268b8fa7e937ed3c6d325f31`，并设置 `Content-Type: image/png` 与一年缓存。占位对象必须能通过 `https://oss.lostsky.work/system/image-not-found.png` 匿名读取。

若已确认当前 Bucket 不含需要保持私有的数据，可显式关闭该 Bucket 的阻止公共访问并设为公共读；匿名用户仍不能写入：

```bash
php think oss:fallback:publish --confirm-public-read
```

该命令只修改 `ALIYUN_OSS_BUCKET` 指定的 Bucket，不修改账号级公共访问策略，并在写入后回读确认 `block_public_access=false`、`acl=public-read`。

先只读检查现有网站规则，再配置 `.jpg`、`.jpeg`、`.png`、`.gif`、`.webp`、`.avif` 六个大小写敏感后缀的 `404 → 302 → https://oss.lostsky.work/system/image-not-found.png`：

```bash
php think oss:fallback:configure --dry-run
php think oss:fallback:configure
```

命令保留现有 IndexDocument、ErrorDocument 和非缺图规则，并在超过 OSS 每 Bucket 20 条规则上限前拒绝写入。规则只对已绑定的自定义域名生效，非图片缺失对象保持 OSS 原错误响应。私有 Bucket 的不存在对象可能返回 `403` 而不是 `404`；本项目的固定规则不把所有 `403` 视为缺图，避免把真实授权失败伪装成文件不存在。控制台手工路径与限制见[阿里云官方配置说明](https://help.aliyun.com/zh/oss/user-guide/redirection)。

上线后用 GET 而不是仅用 HEAD 验收：占位图返回 `200 image/png`，六种图片后缀的随机不存在路径返回 `302` 且 `Location` 为固定对象，随机 `.pdf` 不返回 `3xx`。

<a id="chat-teamless-upgrade"></a>

## Chat teamless 升级

本次升级把聊天入口统一到 `chat.lostsky.work`，群聊所属团队保留，单聊按双方 Entity 归并。Team 提供所属群聊管理。迁移命令默认只读，结构补丁只执行一次，数据迁移可重复执行。

1. 备份聊天表、`team_role_permission` 和团队设置，保存当前发布标签；暂停 Chat 写入、`chat:worker` 和 `chat:cleanup`。
2. 在目标发布目录运行 `php think chat:migrate-teamless`，检查结构缺口、异常单聊、重复会话及旧权限数量。异常参与关系须先核对，不能直接丢弃历史记录。
3. 对尚未升级的库执行 `sql/patches/20261002_chat_teamless.sql`，再运行 `php think chat:migrate-teamless --apply`。迁移保留原消息 ID、作者、时间和回复，建立旧 UUID 映射，补齐待投递事件接收者记录，删除废弃聊天权限但不转换为身份委托权限。
4. 再次运行只读命令，确认结构就绪、待归并会话和待补快照均为零，并核对群聊、成员、消息数量及外键。备份留存至升级验收结束。
5. 同步发布后端、Account、Team 和 Chat 前端。新 Chat 域名提供 SPA 与 WebSocket 入口；旧 `*.chat.lostsky.work` 继续提供新 SPA，让前端保留会话定位并跳转统一域名。重启聊天 worker 和 Centrifugo，清除旧账号通道连接。
6. 验证跨团队单聊、Account 身份切换返回、Team 未入群管理、邀请接受及移除后失权，再恢复写入与清理任务。实时发布使用叶身份会话独立通道，旧共享通道不再承载消息正文。

迁移包含会话归并和权限清理，回退须恢复配套数据库备份及旧发布版本，不能只回滚代码。`tests/chat_migration.php` 使用临时表覆盖归并、UUID 映射、消息与回复保留、已读合并、待投递事件及重复执行；`tests/chat_backend.php` 覆盖身份、参与资格、邀请、屏蔽和集成投递规则。

## 宝塔静态前端部署

宝塔添加站点时会在根目录生成默认 `index.html` 和 `404.html`。LostSky 的 Vite 应用是单入口 SPA，每个应用域名目录只保留 `index.html`，前端路径统一回退到该文件，因此不要直接在已经发布的 `www/{domain}` 目录上添加站点。

以下路由边界是强制部署规范：

| 站点类型 | 域名 | 不存在的路径 |
| --- | --- | --- |
| Vue SPA | `www`、`account`、`admin`、`team`、`chat`、`transaction`、`display`、`shop`、`weibo` 及其团队子域名 | 回退到 `/index.html`，交给 Vue Router |
| 公共静态资源 | `assets.lostsky.work` | 直接返回 `404` |
| 文档站 | `docs.lostsky.work`、`doc.lostsky.work` | 直接返回 `404` |
| ThinkPHP API | `api.lostsky.work` | 使用后端重写规则，不使用 SPA 回退 |

不得为 API、资源或文档站复制 SPA 伪静态规则；也不得让不存在的 JS、CSS、字体或图片回退到 HTML。

Git 标签只包含源码和无法由构建命令再生的原始静态资源，不包含应用与文档站产物。发布机必须在独立发布目录检出不可变标签并生成完整 `www/`：

```bash
git checkout <不可变标签>
npm ci
npm run docs:setup
npm run build
npm run build:docs
```

所有命令成功且应用、资源与文档入口存在后，才能把整个 `www/` 原子替换到站点目录；不要在当前线上目录直接构建。旧标签仍包含当时提交的产物，新规则只适用于完成本次迁移后的标签。

推荐流程：

1. 构建前端，将产物保存在独立发布目录，例如 `/www/deploy/lostsky/www/`。
2. 在宝塔添加站点时使用一次性占位目录，例如 `/www/wwwroot/.bt-bootstrap/account.lostsky.work/`。
3. 完成站点创建和域名绑定后，在「网站 → 设置 → 网站目录」中将根目录切换为真实产物目录，例如 `/www/deploy/lostsky/www/account.lostsky.work/`。同一站点新增域名只使用「域名管理」。
4. 对表中所有 Vue SPA，删除或注释宝塔生成的 `error_page 404 /404.html;`，并统一配置：

   ```nginx
   root /www/deploy/lostsky/www/account.lostsky.work;
   index index.html;

   location / {
       try_files $uri $uri/ /index.html;
   }

   location ~* \.(css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$ {
       try_files $uri =404;
       access_log off;
       expires 30d;
   }
   ```

   第一段保证刷新 `/teams`、`/entitlements/packages` 等前端深链接时仍进入应用；第二段保证缺失静态资源返回真实 `404`，避免浏览器把 `index.html` 当作脚本或样式加载。完整模板以 `deploy/nginx/lostsky-static-wildcard.conf` 为准。
5. `assets.lostsky.work` 不使用 SPA 回退，文件不存在时直接返回 `404`；CORS 配置见[静态资源 CORS](assets-cors.md)。
6. 后续发布只原子替换 `/www/deploy/lostsky/www/` 的内容，不再通过宝塔添加站点。占位目录可以保留，供将来重新建站使用。

保存配置后先执行 `nginx -t`，成功后再重载 Nginx。Windows 宝塔必须在管理员终端中使用宝塔 Nginx 根目录作为前缀：

```powershell
D:\BtSoft\nginx\nginx.exe -p D:\BtSoft\nginx -c conf\nginx.conf -t
D:\BtSoft\nginx\nginx.exe -p D:\BtSoft\nginx -c conf\nginx.conf -s reload
```

每个 SPA 站点至少验收：首页和一个真实前端深链接均返回 `200 text/html`；随机不存在的 `.js` 返回 `404`；文档站随机不存在的路径仍返回 `404`。`OpenEvent(... Access is denied)` 表示执行终端未提升为管理员权限，不代表配置语法错误。

静态站点模板和 API 站点统一引用 Certbot 的稳定证书路径。续期后只需运行 `php think certificate:update`，不需要逐站点复制证书。

文档使用两个正文与产物都独立的静态站点：

- `docs.lostsky.work` 从 `docs/dev/` 构建，指向 `/www/deploy/lostsky/www/docs.lostsky.work/`，只提供开发文档。
- `doc.lostsky.work` 从 `docs/user/` 构建，指向 `/www/deploy/lostsky/www/doc.lostsky.work/`，只提供用户指南。

在宝塔中分别绑定域名和目录，不把两个域名加入同一固定根目录的站点。两者都是 Zensical 静态页面，不使用 Vue 的 `/index.html` 历史回退；完整配置见 `deploy/nginx/lostsky-docs.conf`。新增 `doc.lostsky.work` 后确认 DNS 已指向服务器，并确认共享证书仍覆盖 `*.lostsky.work`，再重载 Nginx。

Windows 宝塔本地部署使用项目现有发布目录：

- `docs.lostsky.work` 指向 `C:/awesome-lostsky/www/docs.lostsky.work`。
- `doc.lostsky.work` 指向 `C:/awesome-lostsky/www/doc.lostsky.work`。

宝塔创建 HTML 项目会覆盖或生成默认首页，因此必须先完成域名和目录绑定，再运行 `npm run build:docs` 恢复两站产物。验收时分别确认开发站出现“开发”“运维”“API”导航且不收录用户正文，用户指南站只出现用户任务导航，并确认不存在的路径返回 `404`。

Admin 使用同一静态发布结构，将 `admin.lostsky.work` 指向 `/www/deploy/lostsky/www/admin.lostsky.work/`，并保留 SPA 的 `try_files` 回退。首次发布顺序固定为：应用 `sql/patches/20260729_admin_platform.sql` 并发布后端；执行 `php think admin:grant --user=<id> --role=super_admin`；发布 Admin 前端及域名；最后验证登录回跳、普通用户 403、治理审计和系统状态。

若服务器目录布局无法调整，应先在宝塔创建并绑定站点，再部署前端，由构建产物最后覆盖默认页面。不要用 `chattr +i` 锁定 `index.html`，否则正常发布也无法替换它。相关行为可参考宝塔的[快速创建站点](https://docs.bt.cn/getting-started/create-web)和[默认页面说明](https://www.bt.cn/bbs/thread-67517-1-1.html)。

## 上线检查

后台任务需要单独配置和验收：

| 任务 | 运行方式 | 验收与恢复 |
| --- | --- | --- |
| 聊天事件与 Webhook | 进程管理器常驻 `php think chat:worker` | 检查进程和投递结果；发布后由进程管理器重启，`queue:restart` 不管理此进程 |
| Ability 到期 | `ability-expiration` Database Worker | 旧 Grant 补投后检查消费者；发布后 `queue:restart` |
| 微博调度 | `weibo-schedule` Database Worker | 检查消费者与任务日志；远端结果不明时不人工重发写请求 |
| 自动结单、生命周期与外部补偿清理 | 调度器定期执行 `php think system:cleanup` | 检查 `autoCompletion.completed/failed`（请求确认超时）与 `unusedCompletion.completed/failed`（未使用权益超时）、其他 JSON 计数和运行日志；保留期来自 `config/cleanup.php` |
| 聊天保留策略 | 调度器定期执行 `php think chat:cleanup` | 检查临时会话关闭与消息清理结果，消息保留期来自 Team Chat 设置 `retention_days` |

周期按目标环境的数据量和保留要求确定并写入部署配置；命令不会自动安装计划任务。清理可能删除数据或执行外部补偿，先确认目标环境和保留策略。命令边界见[控制台命令](console.md)。

```bash
composer check-platform-reqs --no-dev
composer show --no-dev --direct
php think version
```

- 生产环境只安装生产依赖。
- 生产环境确认 `APP_DEBUG=false` 且 `config/auth.php` 中 `sms.debug_bypass=false`，并用真实手机号完成一次验证码发送和校验冒烟测试。
- 生产环境确认 PHP `upload_tmp_dir` 可写、`display_errors=Off`、`log_errors=On`，并验证上传成功与失败响应都为纯 JSON。
- `.env` 注释使用 `;`，避免复杂内容触发解析警告。
- Packagist 访问缓慢时可配置可信的 Composer 镜像源。
- 接口返回 `404` 时，先检查多应用依赖是否完整，再运行 `php think clear`。

## 核销两套超时规则升级（2026-10-04）

按既有数据库升级顺序完成 `20260921_service_auto_complete.sql`，随后依次执行 `sql/patches/20261004_service_completion_confirmation.sql` 与 `sql/patches/20261004_unused_service_settlement.sql`。新补丁可重复执行；确认新增 `completion_requested_at`、权益未使用时限及期限、`settlement_kind`，并检查自动确认索引引用请求时间。部署后旧处理中任务的请求时间保持空，不能把旧 `started_at` 回填成请求时间；旧权益未使用时限为空，不追溯启动惩罚结单。两种规则均由现有 `php think system:cleanup` 调度执行，分别检查 `autoCompletion` 与 `unusedCompletion` 的 completed/failed。先确认目标库，备份后执行补丁；上线复核顾客拒绝/确认入口与商品两项时限同时发布。
- 出现跨域错误时，先确认请求已进入 ThinkPHP，而不是由 Nginx 提前返回；边界说明见 [CORS 文档](../architecture/cors.md)。

## 2026-10-05 手动发放幂等与领取配置

协调更新后端与静态前端，并执行可重复补丁 `sql/patches/20261005_manual_grant_idempotency.sql`；确认目标库后核验旧 `redemption_campaign.per_target_limit` 列已删除，新账本的 JSON 结果列、团队/全局 Entity 外键及团队/操作者/UUID 唯一约束存在。新接口缺少 UUID 返回 422；旧客户端必须与后端同步更新。账本不自动清理，历史领取和权益记录保留。
