import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({ ...base, webServer: [{ command: 'npm run dev:weibo -- --host 127.0.0.1', url: 'http://127.0.0.1:5181', reuseExistingServer: true }] })
