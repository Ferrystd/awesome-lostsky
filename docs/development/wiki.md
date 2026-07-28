# 文档站构建

`docs/` 是所有项目文档的唯一正文来源，Zensical 直接从该目录构建公开文档站，不生成中间副本。

## 首次初始化

Wiki 构建依赖 Zensical（Python >= 3.10）

```bash
npm run docs:setup
```

## 本地预览与发布构建

```bash
npm run docs:dev
npm run build:docs
```

## 维护规则

新增文档时直接编辑 `docs/` 下对应 Markdown，并同步更新 `zensical.toml` 导航。所有项目文档均公开，任何文档都不得写入凭据、Token、Cookie、内部地址或其他敏感信息。

`docs/updates.md` 只摘要最近两个版本，完整事实以 [`docs/changelog.md`](../changelog.md) 为准；发布时同步更新摘要。

> 能写多短写多短！！！
