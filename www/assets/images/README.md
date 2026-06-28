# Images 架构

```
images/
├── site-bg.png        # 主站全局背景 (已有)
├── logo.svg           # 主 Logo (彩色版)
├── logo-white.svg     # 主 Logo (白色版，深色背景用)
├── favicon.ico        # 站点图标 (32×32)
├── og-image.png       # Open Graph 社交分享图 (1200×630)
└── icons/             # SVG 图标库 (Feather Icons 风格)
    ├── user.svg
    ├── team.svg
    ├── shop.svg
    ├── chart.svg
    ├── settings.svg
    ├── search.svg
    ├── plus.svg
    ├── edit.svg
    ├── trash.svg
    ├── check.svg
    ├── x.svg
    ├── arrow-right.svg
    ├── arrow-left.svg
    ├── chevron-down.svg
    ├── external-link.svg
    ├── mail.svg
    ├── phone.svg
    └── menu.svg
```

## 规范

- **Logo**：SVG 格式，支持缩放。提供彩色 + 白色两个版本。
- **图标**：统一 24×24 viewBox，stroke 方式绘制，便于 CSS 控制颜色。
- **背景图**：WebP 优先，降级 JPG/PNG。控制在 200KB 以内。
- **社交图**：1200×630，JPG，80% 质量。
- **各 app 专属图片**：放在 app 目录下（如 `shop/images/product-placeholder.png`），不放 `assets/images/`。
