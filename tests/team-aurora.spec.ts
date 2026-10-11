import { createHash } from 'node:crypto'
import { expect, test, type Page } from './fixtures'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
async function fixture(page: Page) {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.addInitScript(() => {
    const stats = { draws: 0 }
    ;(window as any).auroraStats = stats
    const draw = WebGLRenderingContext.prototype.drawArrays
    WebGLRenderingContext.prototype.drawArrays = function (...args) { stats.draws++; return draw.apply(this, args) }
  })
  await page.route(`${origin}/api/**`, route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access') ? { permissions: ['team'], abilities: {}, identity: { type: 'team', entity_id: 1 } }
      : path.endsWith('/setting/schema') ? { apps: [{ app_name: 'entity', label: '人员', settings: [{ key: 'welcome', label: '欢迎语', type: 'string', control: 'input', value: '欢迎加入', default: '' }] }] }
      : { total: 30, list: Array.from({ length: 30 }, (_, id) => ({ id, title: `通知 ${id}`, content: '请确认团队工作安排。', is_read: 0 })) }
    return route.fulfill({ json: { code: 0, data } })
  })
}
const count = (page: Page) => page.evaluate(() => (window as any).auroraStats.draws as number)
async function staysStill(page: Page) {
  await page.waitForTimeout(100)
  const before = await count(page)
  await page.waitForTimeout(300)
  expect(await count(page)).toBe(before)
}

test('aurora flows within a bounded canvas and stops for pause, visibility, reduced motion and unmount', async ({ page }) => {
  test.setTimeout(60_000)
  await fixture(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/notices/team`)
  const canvas = page.locator('.team-aurora-backdrop canvas.ready')
  await expect(canvas).toBeVisible()
  const hash = async () => createHash('sha256').update(await canvas.screenshot()).digest('hex')
  const first = await hash()
  const before = await count(page)
  const started = Date.now()
  await page.waitForTimeout(1100)
  const frames = (await count(page)) - before
  expect(frames).toBeGreaterThan(5)
  expect(frames / ((Date.now() - started) / 1000)).toBeLessThanOrEqual(25)
  expect(await hash()).not.toBe(first)
  const pixels = await canvas.evaluate(element => (element as HTMLCanvasElement).width * (element as HTMLCanvasElement).height)
  expect(pixels).toBeLessThan(262000)
  await page.getByRole('button', { name: '暂停极光' }).click()
  await staysStill(page)
  const paused = await hash()
  await page.waitForTimeout(300)
  expect(await hash()).toBe(paused)
  await page.getByRole('button', { name: '播放极光' }).click()
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await staysStill(page)
  await page.evaluate(() => { delete (document as any).hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await staysStill(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await staysStill(page)
  await expect(page.getByRole('button', { name: '暂停极光' })).toBeHidden()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // The app root must restore its ordinary theme on a route without this scene.
  await page.evaluate(async () => { const { router } = await import(/* @vite-ignore */ '/src/router.ts'); await router.push('/personal/notices') })
  await expect(page.locator('.team-aurora-backdrop')).toHaveCount(0)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(0)
  await staysStill(page)
  await test.info().attach('aurora-runtime.json', { body: JSON.stringify({ frames, pixels }), contentType: 'application/json' })
})

test('aurora unavailable and lost-context fallbacks keep settings usable', async ({ page }) => {
  await fixture(page)
  await page.goto(`${origin}/settings/`)
  await expect(page.locator('.ls-theme-aurora')).toBeVisible()
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toBeVisible()
  await page.locator('.team-aurora-backdrop canvas').evaluate(element => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '暂停极光' })).toHaveCount(0)
  await staysStill(page)
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: any[]) { return kind === 'webgl' ? null : getContext.call(this, kind as any, ...args) } as typeof getContext
  })
  await page.reload()
  const field = page.getByRole('textbox', { name: '欢迎语' })
  await expect(field).toHaveValue('欢迎加入')
  await field.fill('新的欢迎语')
  await expect(page.locator('.settings-panel button[type=submit]')).toBeEnabled()
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toHaveCount(0)
  expect(await page.locator('.team-aurora-backdrop').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('gradient')
})
