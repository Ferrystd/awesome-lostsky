import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@lostsky/ui': fileURLToPath(new URL('./frontend/packages/ui/src', import.meta.url)),
      '@lostsky/api': fileURLToPath(new URL('./frontend/packages/api/src', import.meta.url)),
      '@lostsky/shared': fileURLToPath(new URL('./frontend/packages/shared/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
