# LostSky API

ThinkPHP 8 多应用后端 API 服务。

## 环境要求

- PHP >= 8.1
- MySQL 5.7+ / MariaDB 10.3+
- Composer 2.x

## 配置 PATH

部署前先把 PHP 目录加入 PATH，并确保可以直接执行 `php` 和 `composer`。

Windows PowerShell 示例：

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

配置后重新打开终端，确认：

```bash
php -v
composer --version
```

## 部署步骤

1. 安装依赖

```bash
composer install --no-dev --prefer-dist --no-interaction
```

2. 配置环境

```bash
cp .env.example .env
```

按实际环境修改 `.env` 中的数据库、域名、JWT、OSS 等配置。

3. 导入数据库

将 `sql/` 下的数据库结构导入目标数据库。

4. 清理缓存

```bash
php think clear
```

5. 配置站点运行目录

站点运行目录必须指向项目的 `public` 目录，而不是项目根目录。

## Nginx 伪静态

```nginx
location / {
    if (!-e $request_filename) {
        rewrite ^(.*)$ /index.php?s=$1 last;
        break;
    }
}
```

## 注意事项

- 本项目使用 ThinkPHP 多应用模式，部署后接口 404 时先检查依赖是否完整，再执行 `php think clear`。
- 生产环境使用 `composer install --no-dev`，不要安装开发依赖。
- `.env` 注释建议使用 `;`，避免复杂中文注释或括号触发 env 解析警告。
- 如果服务器访问 Packagist 较慢，可以配置 Composer 镜像源。
- CORS 由全局中间件处理；若仍报跨域错误，先确认请求是否进入 ThinkPHP，而不是被 Nginx 直接返回。

## 检查命令

```bash
composer check-platform-reqs --no-dev
composer show --no-dev --direct
php think version
```
