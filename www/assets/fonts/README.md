# Fonts 架构

```
fonts/
└── inter/
    ├── inter-regular.woff2   # 400 常规
    ├── inter-medium.woff2    # 500 中等
    └── inter-bold.woff2      # 700 粗体
```

## 加载策略

```css
/* variables.css 中声明 */
@font-face {
    font-family: 'Inter';
    src: url('/assets/fonts/inter/inter-regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;  /* 关键：避免 FOIT */
}
```

## 规范

- **唯一字体**：Inter（覆盖中文回退到系统字体）
- **唯一格式**：woff2（所有现代浏览器支持）
- **font-display: swap**：避免不可见文本闪烁
- **不引入图标字体**：统一使用 SVG 图标
