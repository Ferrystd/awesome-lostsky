# 测试须知

维护项与生成命令见[代码更新清单](checklist.md)。测试先从直接相关范围开始，再按风险扩大。

| 改动 | 测试 |
| --- | --- |
| PHP | `php -l <文件>`、直接相关 PHP 测试 |
| 路由、OpenAPI、后端行为 | 相关测试；全量回归使用 `npm run test:backend` |
| 前端逻辑 | `npm test`、`npm run typecheck` |
| 页面、路由、登录 | `npm run test:e2e`、`npm run build` |
| 媒体、CORS | `npm run check:media`、`npm run check:cors` |
| 文档 | `npm run build:docs` |

## 数据库保护

数据库测试或补丁执行前：

1. 从根 `.env` 读取配置，不输出密码。
2. 核对库名和已有表，确认目标允许测试或迁移。
3. 执行后只读验证列、索引、外键、约束和迁移结果。

目标库已经核对清楚且用户已授权时，应继续执行补丁、fixture 和测试数据清理验证；数据库保护步骤不是默认跳过写入的理由。只有目标库仍不明确、疑似生产环境或缺少授权时才停止。

测试数据使用现有 fixture,推荐调用(生产环境慎用) [`service:call`](../operations/console.md)；写调用前先阅读服务实现。E2E 域名按[开发须知](development.md)配置。
