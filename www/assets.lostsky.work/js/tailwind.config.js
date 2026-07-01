/**
 * 失落青空 (LostSky Studio) - 全局 Tailwind 配置
 * 🔒 此文件锁定，页面修改时不得改动
 * 所有页面统一引用此文件，确保配色和字体全局一致
 */
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#0ea5e9',       // Sky blue - 主色
                secondary: '#8b5cf6',     // Violet - 辅色
                dark: '#0f172a',
                glass: 'rgba(255, 255, 255, 0.05)',
                glassBorder: 'rgba(255, 255, 255, 0.1)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
};
