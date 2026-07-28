# 部署指南

本文说明 LostSky 的生产部署流程。开发环境准备见[开发须知](../development/development.md)，版本发布与恢复见[发布须知](../development/releasing.md)。

## 环境要求

- PHP 8.1+
- MySQL 5.7+ 或 MariaDB 10.3+
- Composer 2

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

3. 将 `sql/schema.sql` 和所需日期补丁导入已确认的目标数据库。
4. 清理框架缓存：

   ```bash
   php think clear
   ```

5. 将 API 站点运行目录指向项目的 `public/`，不要指向项目根目录。

ThinkPHP 站点使用以下 Nginx 规则：

```nginx
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

若服务器目录布局无法调整，应先在宝塔创建并绑定站点，再部署前端，由构建产物最后覆盖默认页面。不要用 `chattr +i` 锁定 `index.html`，否则正常发布也无法替换它。相关行为可参考宝塔的[快速创建站点](https://docs.bt.cn/getting-started/create-web)和[默认页面说明](https://www.bt.cn/bbs/thread-67517-1-1.html)。

## 上线检查

```bash
composer check-platform-reqs --no-dev
composer show --no-dev --direct
php think version
```

- 生产环境只安装生产依赖。
- `.env` 注释使用 `;`，避免复杂内容触发解析警告。
- Packagist 访问缓慢时可配置可信的 Composer 镜像源。
- 接口返回 `404` 时，先检查多应用依赖是否完整，再运行 `php think clear`。
- 出现跨域错误时，先确认请求已进入 ThinkPHP，而不是由 Nginx 提前返回；边界说明见 [CORS 文档](../architecture/cors.md)。
