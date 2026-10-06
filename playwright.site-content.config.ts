import { defineConfig } from '@playwright/test'
import admin from './playwright.admin.config'

export default defineConfig({
  ...admin,
  testMatch: 'site-content.spec.ts',
  webServer: [
    ...(Array.isArray(admin.webServer) ? admin.webServer : []),
    { command: 'npm run dev:site -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
  ],
})
