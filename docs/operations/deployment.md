# 部署指南

本文说明 LostSky 的生产部署流程。开发环境准备见[开发须知](../development/development.md)，版本发布与恢复见[发布须知](../development/releasing.md)。

## 环境要求

- PHP 8.1+
- MySQL 5.7+ 或 MariaDB 10.3+
- Composer 2

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
   log_errors=On
   error_log=/var/log/php/lostsky-error.log
   ```

   创建目录后将所有者设置为 PHP-FPM 运行用户，并通过 `phpinfo()` 或 FPM 配置检查实际加载的 `php.ini`。上线冒烟测试应上传一个小文件，确认 HTTP `Content-Type` 为 `application/json`、响应可被 JSON 解析，且正文开头不存在 `<br>`、`Notice` 或 PHP 警告。

4. 将 `sql/schema.sql` 和所需日期补丁导入已确认的目标数据库。
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

## 宝塔静态前端部署

宝塔添加站点时会在根目录生成默认 `index.html` 和 `404.html`。LostSky 前端是单入口 SPA，每个业务域名目录只保留 `index.html`，前端路径统一回退到该文件，因此不要直接在已经发布的 `www/{domain}` 目录上添加站点。

推荐流程：

1. 构建前端，将产物保存在独立发布目录，例如 `/www/deploy/lostsky/www/`。
2. 在宝塔添加站点时使用一次性占位目录，例如 `/www/wwwroot/.bt-bootstrap/account.lostsky.work/`。
3. 完成站点创建和域名绑定后，在「网站 → 设置 → 网站目录」中将根目录切换为真实产物目录，例如 `/www/deploy/lostsky/www/account.lostsky.work/`。同一站点新增域名只使用「域名管理」。
4. 删除或注释宝塔生成的 `error_page 404 /404.html;`，并配置：

   ```nginx
   root /www/deploy/lostsky/www/account.lostsky.work;
   index index.html;

   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

5. `assets.lostsky.work` 不使用 SPA 回退，文件不存在时直接返回 `404`；完整模板见 `deploy/nginx/lostsky-static-wildcard.conf`，CORS 配置见[静态资源 CORS](assets-cors.md)。
6. 后续发布只原子替换 `/www/deploy/lostsky/www/` 的内容，不再通过宝塔添加站点。占位目录可以保留，供将来重新建站使用。

静态站点模板和 API 站点统一引用 Certbot 的稳定证书路径。续期后只需运行 `php think certificate:update`，不需要逐站点复制证书。

文档使用两个独立静态站点，共享 `docs/manual/` 正文但使用不同导航和产物目录：

- `docs.lostsky.work` 指向 `/www/deploy/lostsky/www/docs.lostsky.work/`，提供完整项目文档。
- `doc.lostsky.work` 指向 `/www/deploy/lostsky/www/doc.lostsky.work/`，只提供用户指南。

在宝塔中分别绑定域名和目录，不把两个域名加入同一固定根目录的站点。两者都是 Zensical 静态页面，不使用 Vue 的 `/index.html` 历史回退；完整配置见 `deploy/nginx/lostsky-docs.conf`。新增 `doc.lostsky.work` 后确认 DNS 已指向服务器，并确认共享证书仍覆盖 `*.lostsky.work`，再重载 Nginx。

Windows 宝塔本地部署使用项目现有发布目录：

- `docs.lostsky.work` 指向 `C:/awesome-lostsky/www/docs.lostsky.work`。
- `doc.lostsky.work` 指向 `C:/awesome-lostsky/www/doc.lostsky.work`。

宝塔创建 HTML 项目会覆盖或生成默认首页，因此必须先完成域名和目录绑定，再运行 `npm run build:docs` 恢复两站产物。验收时分别确认完整站出现“开发”“运维”“API”导航，用户指南站只出现用户任务导航，并确认不存在的路径返回 `404`。

Admin 使用同一静态发布结构，将 `admin.lostsky.work` 指向 `/www/deploy/lostsky/www/admin.lostsky.work/`，并保留 SPA 的 `try_files` 回退。首次发布顺序固定为：应用 `sql/patches/20260729_admin_platform.sql` 并发布后端；执行 `php think admin:grant --user=<id> --role=super_admin`；发布 Admin 前端及域名；最后验证登录回跳、普通用户 403、治理审计和系统状态。

若服务器目录布局无法调整，应先在宝塔创建并绑定站点，再部署前端，由构建产物最后覆盖默认页面。不要用 `chattr +i` 锁定 `index.html`，否则正常发布也无法替换它。相关行为可参考宝塔的[快速创建站点](https://docs.bt.cn/getting-started/create-web)和[默认页面说明](https://www.bt.cn/bbs/thread-67517-1-1.html)。

## 上线检查

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
- 出现跨域错误时，先确认请求已进入 ThinkPHP，而不是由 Nginx 提前返回；边界说明见 [CORS 文档](../architecture/cors.md)。
