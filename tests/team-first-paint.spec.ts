import { expect, test } from './fixtures'
import { applyStylesBeforeMain, auroraBackground, expectAuroraCanvas, holdMain, seedTeamIdentity } from './first-paint-helpers'

const origin = 'http://demo.team.lostsky.work:5175'

test('Team aurora canvas stays dark before scripts, after CSS and after route readiness', async ({ page }) => {
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
  await applyStylesBeforeMain(page, ['frontend/packages/ui/src/styles.css'])
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
})
