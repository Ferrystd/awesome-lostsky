import { expect, test } from '@playwright/test'

test('Team grouped navigation preserves child routes and separate review and notice scopes', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'team', id: 1 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  const reads: string[] = []
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const url = new URL(route.request().url())
    reads.push(url.pathname + url.search)
    const data = url.pathname.endsWith('/access') ? { permissions: ['team'], abilities: {}, identity: { type: 'team' } }
      : url.pathname.endsWith('/schema') ? { apps: [] }
      : url.pathname.endsWith('/entity/index') ? { list: [{ id: 10, entityable_id: 7, entityable_type: 'teamMember', slug: 'member-seven', profile: { name: '成员七' } }] }
      : /\/(entityField|joinField|chatVirtual)\/index$/.test(url.pathname) ? []
      : { list: [], total: 0 }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  const visit = (path: string) => page.goto(`http://demo.team.lostsky.work:5175${path}`)
  await visit('/')
  await expect(page.locator('.team-resource-map').getByRole('navigation', { name: '团队管理' })).toBeVisible()
  await expect(page.locator('.team-resource-map').getByRole('navigation', { name: '人事管理' })).toBeVisible()
  await page.locator('.team-resource-map').getByRole('link', { name: /人事审核/ }).click()
  await page.getByRole('link', { name: '离队', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/departure-review$/)
  await page.reload()
  await expect(page.getByRole('link', { name: '离队', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('link', { name: '加入与复职' }).click()
  await page.getByRole('link', { name: '申请表配置' }).click()
  await expect(page).toHaveURL(/\/join-fields$/)
  await page.getByRole('link', { name: '返回人事审核' }).click()
  await expect(page).toHaveURL(/\/join-review$/)
  await visit('/notices/entity')
  await page.getByRole('link', { name: '平台通知' }).click()
  await expect(page).toHaveURL(/\/notices\/team$/)
  await expect.poll(() => reads.some(path => path.includes('/notice/index') && path.includes('scope=team'))).toBe(true)
  expect(reads.some(path => path.includes('/notice/index') && path.includes('scope=entity'))).toBe(true)
  await expect(page.getByRole('link', { name: '发送通知' })).toHaveAttribute('href', '/notices/send')
  await visit('/entities')
  await expect(page.locator('.entity-main')).toHaveAttribute('href', '/member-detail?id=7')
  await page.getByRole('link', { name: '对象字段', exact: true }).click()
  await page.getByRole('link', { name: '返回人员' }).click()
  await page.getByRole('link', { name: '虚拟人员', exact: true }).click()
  await page.getByRole('link', { name: '返回人员' }).click()
  await visit('/settings')
  await expect(page.getByRole('link', { name: '团队能力', exact: true })).toHaveAttribute('href', '/abilities')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  // Restricted shared inbox still exposes the personal inbox and send-page entrance.
  await page.route('http://demo.team.lostsky.work:5175/api/access', route => route.fulfill({ json: { code: 0, data: { permissions: [], abilities: {}, identity: { type: 'team' } } } }))
  await visit('/notices/team')
  await expect(page.getByRole('link', { name: '当前人员收件箱' })).toBeVisible()
  await expect(page.getByRole('link', { name: '发送通知' })).toBeVisible()
  await expect(page.getByRole('status').getByText(/team\.notice\.read/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})
