import { readFileSync } from 'node:fs'
import { expect, type Page } from './fixtures'

export const auroraBackground = 'rgb(16, 22, 25)'
export async function expectAuroraCanvas(page: Page) {
  await expect(page.locator('html')).toHaveCSS('background-color', auroraBackground)
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('body')).toHaveCSS('background-color', auroraBackground)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#101619')
}

export async function holdMain(page: Page) {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/src/main.ts', async route => { await gate; await route.continue() })
  return release
}

export async function applyStylesBeforeMain(page: Page, paths: string[]) {
  for (const path of paths) {
    // Preserve the real rules; skip network fonts and build-time Tailwind directives.
    const content = readFileSync(path, 'utf8').replace(/@(?:import|tailwind)[^;]+;/g, '')
    await page.addStyleTag({ content })
  }
}

export async function seedTeamIdentity(page: Page) {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'team', id: 1 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
}
