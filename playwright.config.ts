import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: { timeout: 12_000 },
  use: {
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--host-resolver-rules=MAP demo.display.lostsky.work 127.0.0.1, MAP demo.shop.lostsky.work 127.0.0.1'],
    },
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'npm run dev:site -- --host 127.0.0.1', url: 'http://www.lostsky.work:5173', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:account -- --host 127.0.0.1', url: 'http://account.lostsky.work:5174/login', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:team -- --host 127.0.0.1', url: 'http://demo.team.lostsky.work:5175/join', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:chat -- --host 127.0.0.1', url: 'http://demo.chat.lostsky.work:5176', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:transaction -- --host 127.0.0.1', url: 'http://demo.transaction.lostsky.work:5177', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:display -- --host 127.0.0.1', url: 'http://127.0.0.1:5178', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:shop -- --host 127.0.0.1', url: 'http://127.0.0.1:5179', reuseExistingServer: !process.env.CI },
  ],
})
