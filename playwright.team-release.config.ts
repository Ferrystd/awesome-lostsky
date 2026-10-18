import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({ ...base, webServer: (base.webServer as any[]).filter(s => /dev:(account|team) /.test(s.command)).map(s => ({ ...s, reuseExistingServer: false })) })
