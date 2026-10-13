import { expect, test, type Page } from './fixtures'

const origin = process.env.OVERVIEW_PILOT_ORIGIN || 'http://demo.transaction.lostsky.work:5177'
const snapshot = {
  team: { id: 1, slug: 'demo', name: '青空协作组' }, permissions: [], abilities: {},
  identity: { entity_id: 11, type: 'teamMember', name: '青空接单人', slug: 'handler', belongs_to_team: true, is_external: false },
}
async function signIn(page: Page) {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
}
async function overflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  const links = await page.locator('.ls-overview-page a').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }))
  expect(links.every(rect => rect.width >= 44 && rect.height >= 44)).toBe(true)
}

test('overview pilot keeps all entries and exact scene opt-in across widths and enlarged text', async ({ page }, testInfo) => {
  await signIn(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`) })
  const requests: string[] = []
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    requests.push(path)
    expect(path).toBe('/api/workspace/access')
    await route.fulfill({ json: { code: 0, data: snapshot } })
  })
  await page.goto(`${origin}/overview`)
  await expect(page.locator('.ls-overview-page')).toBeVisible()
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await expect(page.locator('.ls-workspace-header')).toHaveClass(/--scene/)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  await expect(page.locator('#workspace')).toHaveCSS('max-width', '1440px')
  for (const [label, path] of [['团队流水', '/transactions'], ['经营统计', '/stats'], ['权益核销', '/services'], ['顾客余额', '/balances']]) {
    await expect(page.locator('.ls-overview-page').getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', path)
  }
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await overflow(page)
    expect(await page.locator('.ls-overview-page').evaluate(el => getComputedStyle(el).gap)).toBe('24px')
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: testInfo.outputPath('overview-desktop.png'), fullPage: true })
  const motion = page.getByRole('button', { name: '暂停极光' })
  if (await motion.isVisible()) {
    await motion.click()
    await expect(page.getByRole('button', { name: '播放极光' })).toHaveAttribute('aria-pressed', 'true')
  }
  await page.setViewportSize({ width: 375, height: 900 })
  await expect.poll(() => page.locator('.sidebar').evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(0)
  await expect(page.locator('.bottom-nav')).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await page.screenshot({ path: testInfo.outputPath('overview-mobile.png'), fullPage: true })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await overflow(page)
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  const personal = page.locator('.ls-overview-page').getByRole('link', { name: '进入个人工作台' })
  await personal.focus()
  await expect(personal).toBeFocused()
  // Permission and Ability are absent: overview navigation remains usable; protected data does not load.
  await page.locator('.ls-overview-page').getByRole('link', { name: /权益核销/ }).click()
  await expect(page).toHaveURL(`${origin}/services`)
  await expect(page.locator('.ls-empty-state')).toContainText('service.redemption.read')
  await expect(page.locator('.team-scene, .ls-theme-aurora')).toHaveCount(2)
  await expect(page.locator('.ls-workspace-header')).toHaveClass(/--scene/)
  await expect(page.locator('.bottom-nav')).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await page.goBack()
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: /极光/ })).toHaveCount(0)
  expect(new Set(requests)).toEqual(new Set(['/api/workspace/access']))
  expect(errors).toEqual([])
})

for (const state of ['long', 'empty', 'loading', 'error'] as const) {
  test(`overview pilot ${state} snapshot preserves working navigation`, async ({ page }) => {
    await signIn(page)
    let request = 0
    await page.route(`${origin}/api/**`, async route => {
      expect(new URL(route.request().url()).pathname).toBe('/api/workspace/access')
      request++
      if (state === 'loading' || state === 'error') {
        if (state === 'loading' && request > 1) return
        return route.fulfill({ status: 400, json: { code: 400, message: '摘要读取失败', data: null } })
      }
      const data = state === 'empty' ? { ...snapshot, team: null, identity: undefined } : { ...snapshot, team: { ...snapshot.team, name: '青空跨团队数字服务协作中心'.repeat(8) }, identity: { ...snapshot.identity, name: '长名称接单人员'.repeat(8) } }
      await route.fulfill({ json: { code: 0, data } })
    })
    await page.goto(`${origin}/overview`)
    await expect(page.locator('.ls-overview-page')).toBeVisible()
    if (state === 'loading') await expect(page.locator('.ls-overview-page [aria-busy="true"]')).toBeVisible()
    if (state === 'error') {
      await expect(page.locator('.ls-overview-page .ls-async-state[role="alert"]')).toHaveCount(1)
      await expect(page.getByText('团队摘要暂时不可用', { exact: true })).toHaveCount(1)
    }
    if (state === 'empty') await expect(page.locator('.ls-description-list dd')).toHaveText(['-', '-', '进入个人工作台，记录本人参与的业务。'])
    await expect(page.locator('.ls-overview-page .ls-dashboard-path a')).toHaveCount(4)
    for (const width of [320, 768, 1920]) {
      await page.setViewportSize({ width, height: 1000 })
      await overflow(page)
    }
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await overflow(page)
  })
}
