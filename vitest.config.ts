import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { previewUiAlias } from './frontend/component-previews/resolve-ui.mjs'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      previewUiAlias(fileURLToPath(new URL('./frontend', import.meta.url))),
      { find: '@lostsky/api', replacement: fileURLToPath(new URL('./frontend/packages/api/src', import.meta.url)) },
      { find: '@lostsky/shared', replacement: fileURLToPath(new URL('./frontend/packages/shared/src', import.meta.url)) },
    ],
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
