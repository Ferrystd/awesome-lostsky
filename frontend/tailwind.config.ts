import type { Config } from 'tailwindcss'

export default {
  content: ['./frontend/**/*.{vue,ts,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
