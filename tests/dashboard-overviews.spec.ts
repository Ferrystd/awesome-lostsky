import { expect, test, type Page } from '@playwright/test'

const identity = { entity_id: 1, type: 'team', slug: 'demo', name: '青空协作组', belongs_to_team: true, is_external: false }
const team = { id: 1, slug: 'demo', name: '青空协作组' }
const stats = { handler_count: 12, sender_count: 7, cs_count: 3, monthly_performance_total: '1234.50', monthly_flow_total: '4321.00', performance_total: '9999.00' }

async function mockOverview(page: Page) {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'team', id: 1 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  await page.addInitScript(token => localStorage.setItem('lostsky_token', token), token)
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = []
    if (path.endsWith('/access')) data = { team, identity, permissions: [], abilities: {} }
    else if (path.endsWith('/session')) data = { user: { id: 1, username: 'admin' }, roles: [], permissions: ['admin.dashboard.read'], is_super_admin: true }
    else if (path.endsWith('/personal/stats')) data = stats
    else if (path.endsWith('/personal')) data = { identity: { ...identity, team }, profile: { name: identity.name }, custom_fields: [], custom_field_values: [], role_assignments: [], effective_permissions: [] }
    else if (path.endsWith('/dashboard')) data = url.port === '5180'
      ? { counts: { users: 128, teams: 16, active_sessions: 84, administrators: 3, banned_users: 2, banned_teams: 1, new_users_7d: 9, new_teams_7d: 2 }, recent_users: [], recent_teams: [], recent_audit_events: [] }
      : Object.fromEntries(['entities', 'members', 'documents', 'notices'].map((key, i) => [key, { available: i !== 3, count: i !== 3 ? [20, 12, 8][i] : null, error: null, reason: null }]))
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
}

const surfaces = [
  ['team', 'http://demo.team.lostsky.work:5175/', '组织与访问'],
  ['team-personal', 'http://demo.team.lostsky.work:5175/personal', '资料'],
  ['shop', 'http://demo.shop.lostsky.work:5179/manage', '商品配置链'],
  ['shop-personal', 'http://demo.shop.lostsky.work:5179/manage/personal', '搭建我的商品'],
  ['transaction', 'http://demo.transaction.lostsky.work:5177/overview', '收支核对'],
  ['transaction-personal', 'http://demo.transaction.lostsky.work:5177/personal', '我的业务表现'],
  ['admin', 'http://127.0.0.1:5180/', '平台总览'],
] as const

for (const [name, url, heading] of surfaces) {
  test(`dashboard ${name} preserves content, navigation and responsive geometry`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await mockOverview(page)
    await page.goto(url)
    const overview = page.locator('.ls-workspace-overview')
    await expect(overview.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    if (name === 'team') {
      await expect(overview.getByLabel('团队资源摘要').locator('dd')).toHaveText(['20', '12', '8', '-'])
    }
    if (name === 'transaction-personal') {
      await expect(overview.getByLabel('个人业务统计').locator('dd')).toHaveText(['12', '7', '3', '¥1234.50', '¥4321.00', '¥9999.00'])
    }
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const geometry = await overview.evaluate(root => {
        const hero = root.querySelector<HTMLElement>('.ls-workspace-overview__hero')!
        const heroBox = hero.getBoundingClientRect()
        const links = [...root.querySelectorAll<HTMLElement>('a')].filter(a => a.getBoundingClientRect().height > 0)
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          offenders: [...root.querySelectorAll<HTMLElement>('*')].filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map(el => el.className).slice(0, 12),
          heroOverflow: Math.max(...[...hero.children].map(el => el.getBoundingClientRect().bottom - heroBox.bottom)),
          linkHeights: links.map(a => a.getBoundingClientRect().height),
        }
      })
      expect(geometry.overflow, `${name} at ${width}: ${JSON.stringify(geometry.offenders)}`).toBeLessThanOrEqual(1)
      expect(geometry.heroOverflow, `${name} hero at ${width}`).toBeLessThanOrEqual(1)
      expect(geometry.linkHeights.every(height => height >= 44), `${name} touch targets at ${width}`).toBeTruthy()
    }
    await page.setViewportSize({ width: 375, height: 1000 })
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    const first = overview.getByRole('link').first()
    await first.focus()
    await expect(first).toBeFocused()
    expect(errors).toEqual([])
  })
}

test('dashboard personal statistics distinguish loading, denied and error from real zero', async ({ page }) => {
  await mockOverview(page)
  await page.route('**/api/personal/stats', route => route.fulfill({ json: { code: 0, message: 'ok', data: { accessDenialReason: '测试读取受限' } } }))
  await page.goto('http://demo.transaction.lostsky.work:5177/personal')
  await expect(page.getByLabel('个人业务统计').locator('dd')).toHaveText(['-', '-', '-', '-', '-', '-'])
  await page.route('**/api/personal/stats', route => route.fulfill({ status: 503, json: { code: 503, message: '读取失败', data: null } }))
  await page.reload()
  await expect(page.locator('.ls-inline-error')).toBeVisible({ timeout: 20000 })
  await expect(page.getByLabel('个人业务统计').locator('dd')).toHaveText(['-', '-', '-', '-', '-', '-'])
  await expect(page.locator('.ls-workspace-overview').getByRole('link', { name: /我的接单/ })).toBeVisible()
})
