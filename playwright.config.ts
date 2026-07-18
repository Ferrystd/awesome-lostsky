import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: { timeout: 12_000 },
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'npm run dev:site -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:account -- --host 127.0.0.1', url: 'http://127.0.0.1:5174/login', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:team -- --host 127.0.0.1', url: 'http://127.0.0.1:5175/join', reuseExistingServer: !process.env.CI },
  ],
})
