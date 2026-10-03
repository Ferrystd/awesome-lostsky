import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({
  ...base,
  testMatch: ['chat.spec.ts', 'chat-teamless.spec.ts'],
  webServer: Array.isArray(base.webServer) ? base.webServer.filter(server => /dev:(account|team|chat) /.test(server.command)) : base.webServer,
})
