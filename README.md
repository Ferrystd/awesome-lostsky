# LostSky API

基于 ThinkPHP 8 的纯后端 API 服务，采用多应用模式。

## 环境要求

- PHP >= 8.0
- MySQL 5.7+ / MariaDB 10.3+
- Composer 2.x

## 安装

```bash
# 1. 克隆仓库
git clone https://github.com/Ferrystd/awesome-lostsky.git
cd awesome-lostsky

# 2. 安装依赖
composer install

# 3. 配置环境
cp .env.example .env
# 编辑 .env 填写数据库连接、JWT 密钥等信息

# 4. 导入数据库
# 将 sql/schema.sql 导入你的 MySQL 数据库

# 5. 确保 runtime 目录可写
chmod -R 755 runtime
chmod -R 755 public
```

## 目录结构

```
app/
├── account/      # 认证应用 (注册、登录、设备管理)
├── console/      # 控制台应用
├── display/      # 展示应用
├── team/         # 团队应用 (成员管理、职务管理)
├── model/        # 模型层 (统一继承 Base)
├── service/      # 服务层 (业务逻辑封装)
├── validate/     # 验证器
└── middleware/    # 中间件 (JWT、Context、TeamAccess 等)
config/           # 配置文件
route/            # 路由
sql/              # 数据库 Schema
docs/             # 开发文档
```

## 核心特性

- **多应用模式**：account / console / display / team 独立应用
- **JWT 认证**：无状态鉴权，支持设备管理
- **个人即团队**：个人和团队统一在 Team 模型，代码无分支
- **软删除**：所有模型统一支持，Base 层自动处理
- **关联绑定**：Profile 类 1:1 模型通过 `bind()` 平铺字段

## 启动开发服务器

```bash
php think run
```

默认监听 `localhost:8000`。
