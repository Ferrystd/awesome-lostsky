import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures'
import { applyStylesBeforeMain, auroraBackground, expectAuroraCanvas, holdMain, seedTeamIdentity } from './first-paint-helpers'

const origin = 'http://demo.shop.lostsky.work:5179'

test('Backoffice HTML paints the aurora palette while application scripts are blocked', async ({ page }) => {
  await page.route('**/*', async route => {
    if (route.request().resourceType() !== 'document') return route.abort()
    const app = new URL(route.request().url()).searchParams.get('app')!
    await route.fulfill({ contentType: 'text/html', body: readFileSync(`frontend/apps/${app}/index.html`, 'utf8') })
  })
  for (const app of ['account', 'admin', 'chat', 'transaction', 'weibo']) {
    await page.goto(`${origin}/?app=${app}`)
    await expectAuroraCanvas(page)
    await applyStylesBeforeMain(page, ['frontend/packages/ui/src/styles.css'])
    await expectAuroraCanvas(page)
  }
})

test('Shop first paint scopes aurora to the manage path boundary', async ({ page }) => {
  await page.route('**/src/main.ts', route => route.abort())
  for (const path of ['/manage', '/manage/?x=1#form', '/manage/products?x=1#form', '/MANAGE']) {
    await page.goto(`${origin}${path}`)
    await expectAuroraCanvas(page)
    await applyStylesBeforeMain(page, ['frontend/packages/ui/src/styles.css', 'frontend/apps/shop/src/app.css'])
    await expectAuroraCanvas(page)
  }
  for (const path of ['/', '/management', '/manage-other', '/product/1?redirect=/manage#manage']) {
    await page.goto(`${origin}${path}`)
    await expect(page.locator('html')).not.toHaveAttribute('data-ls-surface', 'aurora')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#020617')
  }
})

test('Shop initial route and SPA transitions retain the correct document surface', async ({ page }) => {
  await seedTeamIdentity(page)
  let releaseAccess!: () => void
  const gate = new Promise<void>(resolve => { releaseAccess = resolve })
  let accessRequested = false
  await page.route(`${origin}/api/**`, async route => {
    const access = new URL(route.request().url()).pathname.endsWith('/access')
    if (access) { accessRequested = true; await gate }
    await route.fulfill({ json: { code: 0, data: access
      ? { permissions: ['shop'], abilities: {}, identity: { type: 'team', is_external: false }, team: { slug: 'demo' } }
      : { list: [], total: 0 } } })
  })
  const releaseMain = await holdMain(page)
  await page.goto(`${origin}/manage?first-paint=1#overview`, { waitUntil: 'commit' })
  await expectAuroraCanvas(page)
  await applyStylesBeforeMain(page, ['frontend/packages/ui/src/styles.css', 'frontend/apps/shop/src/app.css'])
  await expectAuroraCanvas(page)
  releaseMain()
  await expect.poll(() => accessRequested).toBe(true)
  await expect(page.locator('#app')).toBeEmpty()
  await expectAuroraCanvas(page)
  releaseAccess()
  await expect(page.locator('#app .ls-theme-aurora').first()).toBeVisible()
  await expect(page.locator('#app .ls-theme-aurora').first()).toHaveCSS('background-color', auroraBackground)
  await expectAuroraCanvas(page)
  const navigate = (path: string) => page.evaluate(async path => {
    const app = document.querySelector('#app') as HTMLElement & { __vue_app__: { config: { globalProperties: { $router: { push: (path: string) => Promise<unknown> } } } } }
    await app.__vue_app__.config.globalProperties.$router.push(path)
  }, path)
  await navigate('/management?from=manage#outside')
  await expect(page.locator('html')).not.toHaveAttribute('data-ls-surface', 'aurora')
  await expect(page.locator('html')).toHaveAttribute('data-shop-surface', 'storefront')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#020617')
  await navigate('/manage/products?return=1#list')
  await expectAuroraCanvas(page)
  await page.reload()
  await expect(page.locator('#app .ls-theme-aurora').first()).toBeVisible()
  await expectAuroraCanvas(page)
})
