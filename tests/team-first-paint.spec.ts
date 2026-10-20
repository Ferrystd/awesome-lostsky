import { expect, test } from './fixtures'
import { applyStylesBeforeMain, auroraBackground, expectAuroraCanvas, holdMain, seedTeamIdentity } from './first-paint-helpers'

const origin = 'http://demo.team.lostsky.work:5175'

test('Team aurora canvas stays dark before scripts, after CSS and after route readiness', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await seedTeamIdentity(page)
  let releaseAccess!: () => void
  const accessGate = new Promise<void>(resolve => { releaseAccess = resolve })
  let accessRequested = false
  await page.route(`${origin}/api/**`, async route => {
    const access = new URL(route.request().url()).pathname.endsWith('/access')
    if (access) { accessRequested = true; await accessGate }
    await route.fulfill({ json: { code: 0, data: access
      ? { permissions: ['team'], abilities: {}, identity: { type: 'team', is_external: false }, team: { slug: 'demo' } }
      : { list: [], total: 0, fields: [] } } })
  })
  const releaseMain = await holdMain(page)
  await page.goto(`${origin}/?first-paint=1#overview`, { waitUntil: 'commit' })
  await expectAuroraCanvas(page)
  await expect(page.locator('#app')).toBeEmpty()
  await applyStylesBeforeMain(page, ['frontend/apps/team/src/ui/styles.css'])
  await expectAuroraCanvas(page)
  releaseMain()
  await expect.poll(() => accessRequested).toBe(true)
  await expect(page.locator('#app')).toBeEmpty()
  await expectAuroraCanvas(page)
  releaseAccess()
  await expect(page.locator('#app .ls-theme-aurora').first()).toBeVisible()
  await expectAuroraCanvas(page)
  // Bind critical HTML to the real palette, so palette changes cannot silently reintroduce a flash.
  await expect(page.locator('#app .ls-theme-aurora').first()).toHaveCSS('background-color', auroraBackground)
  await page.goto(`${origin}/join?ref=test#apply`)
  await expect(page.locator('#app .ls-theme-aurora').first()).toBeVisible()
  await expectAuroraCanvas(page)
  expect(errors).toEqual([])
})

test('Team anonymous guard redirects to login without mounting or rejecting readiness', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const destination = `${origin}/entities?from=first-paint#people`
  const leavingStates: { mounted: boolean; background: string }[] = []
  page.on('console', message => {
    if (message.text().startsWith('team-leaving:')) leavingStates.push(JSON.parse(message.text().slice('team-leaving:'.length)))
  })
  await page.addInitScript(teamOrigin => {
    addEventListener('pagehide', () => {
      if (location.origin === teamOrigin) console.info(`team-leaving:${JSON.stringify({
        mounted: Boolean(document.querySelector('#app')?.childElementCount),
        background: getComputedStyle(document.documentElement).backgroundColor,
      })}`)
    })
  }, origin)
  let requestedLogin = ''
  await page.route('http://account.lostsky.work:5174/login**', async route => {
    requestedLogin = route.request().url()
    await route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>登录入口</h1>' })
  })
  await page.goto(destination, { waitUntil: 'commit' })
  await expect(page.getByRole('heading', { name: '登录入口' })).toBeVisible()
  expect(new URL(requestedLogin).searchParams.get('redirect')).toBe(destination)
  await expect(page).toHaveURL(requestedLogin)
  expect(leavingStates).toEqual([{ mounted: false, background: auroraBackground }])
  expect(errors).toEqual([])
})

test('Team unexpected router readiness rejection remains observable and does not mount', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/src/router.ts', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'export const router = { install() {}, isReady: () => Promise.reject(new Error("unexpected startup failure")) }',
  }))
  await page.goto(`${origin}/`)
  await expect.poll(() => errors).toEqual(['unexpected startup failure'])
  await expect(page.locator('#app')).toBeEmpty()
  await expectAuroraCanvas(page)
})
