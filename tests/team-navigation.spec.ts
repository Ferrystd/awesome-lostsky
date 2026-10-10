import { expect, test } from './fixtures'

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
  const groups = page.locator('.team-resource-map').getByRole('navigation')
  await expect(groups.nth(0).getByRole('link', { name: /^人员管理/ })).toBeVisible()
  await expect(groups.nth(0).getByRole('link', { name: /^顾客管理/ })).toBeVisible()
  await expect(groups.nth(0).getByRole('link', { name: /^文档管理/ })).toBeVisible()
  await expect(groups.nth(1).getByRole('link', { name: /^角色权限/ })).toBeVisible()
  const teamBox = await groups.nth(0).boundingBox()
  const personnelBox = await groups.nth(1).boundingBox()
  expect(personnelBox!.y).toBeGreaterThanOrEqual(teamBox!.y + teamBox!.height)
  const firstEntry = await groups.nth(0).getByRole('link').first().boundingBox()
  expect(firstEntry!.height).toBeGreaterThanOrEqual(44)
  const sidebar = page.locator('aside[aria-label="团队导航"]')
  await expect(sidebar.getByRole('link', { name: '角色权限', exact: true }).locator('svg').first()).toHaveClass(/lucide-shield-check/)
  await expect(sidebar.getByRole('link', { name: '人事审核', exact: true }).locator('svg').first()).toHaveClass(/lucide-clipboard-check/)
  await expect(sidebar.locator('.logout svg')).toHaveClass(/lucide-user-round/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.locator('.team-resource-map').getByRole('link', { name: /人事审核/ }).click()
  const reviewLink = page.getByRole('link', { name: '离队', exact: true })
  expect((await reviewLink.boundingBox())!.height).toBe(44)
  await reviewLink.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/departure-review$/)
  await page.reload()
  await expect(page.getByRole('link', { name: '离队', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('link', { name: '加入与复职' }).click()
  await page.getByRole('link', { name: '申请表配置' }).click()
  await expect(page).toHaveURL(/\/join-fields$/)
  await page.getByRole('link', { name: '返回人事审核' }).click()
  await expect(page).toHaveURL(/\/join-review$/)
  await visit('/personal/notices')
  await expect(page.locator('aside[aria-label="团队导航"] .logout')).toHaveText('切换身份')
  await expect(page.locator('aside[aria-label="团队导航"] .logout')).toHaveAttribute('href', /^http:\/\/account\.lostsky\.work:5174\/identity\?/)
  await expect.poll(() => reads.some(path => path.includes('/notice/index') && path.includes('scope=entity'))).toBe(true)
  await expect(page.getByRole('link', { name: '平台通知', exact: true })).toHaveCount(0)
  await visit('/notices/sent')
  await page.getByRole('link', { name: '平台通知' }).click()
  await expect(page).toHaveURL(/\/notices\/team$/)
  await expect.poll(() => reads.some(path => path.includes('/notice/index') && path.includes('scope=team'))).toBe(true)
  expect(reads.some(path => path.includes('/notice/index') && path.includes('scope=entity'))).toBe(true)
  await expect(page.getByRole('link', { name: '发送通知', exact: true })).toHaveAttribute('href', '/notices/send')
  await visit('/entities')
  await expect(page.locator('.ls-resource-row__main')).toHaveAttribute('href', '/member-detail?id=7')
  await page.getByRole('link', { name: '对象字段', exact: true }).click()
  await page.getByRole('link', { name: '返回人员' }).click()
  await page.getByRole('link', { name: '虚拟人员', exact: true }).click()
  await page.getByRole('link', { name: '返回人员' }).click()
  await visit('/settings')
  await expect(page.getByRole('link', { name: '团队能力', exact: true })).toHaveAttribute('href', '/abilities')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  // Restricted shared inbox still exposes sent notices and the send-page entrance.
  await page.route('http://demo.team.lostsky.work:5175/api/access', route => route.fulfill({ json: { code: 0, data: { permissions: [], abilities: {}, identity: { type: 'team' } } } }))
  await visit('/notices/team')
  await expect(page.getByRole('link', { name: '已发送通知' })).toBeVisible()
  await expect(page.getByRole('link', { name: '发送通知', exact: true })).toBeVisible()
  await expect(page.getByRole('status').getByText(/team\.notice\.read/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('Sent notice inspection is read-only and personal inbox remains actionable', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'team', id: 1 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  const confirms: string[] = []
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const url = new URL(route.request().url())
    const notice = { id: 31, entity_id: 10, title: '任务提醒', content: '请查看任务。', is_read: 0 }
    if (url.pathname.endsWith('/notice/confirm')) confirms.push(route.request().postData() ?? '')
    const data = url.pathname.endsWith('/access') ? { permissions: ['team'], abilities: {}, identity: { type: 'team' } }
      : url.pathname.endsWith('/notice/get') ? notice
      : url.pathname.endsWith('/notice/index') ? { list: [notice], total: 1 }
      : {}
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto('http://demo.team.lostsky.work:5175/notices/sent')
  await expect(page.getByRole('link', { name: '全部标为已读' })).toHaveCount(0)
  await page.locator('.ls-resource-list').getByRole('link').click()
  await expect(page.getByText('通知查看情况', { exact: true }).last()).toBeVisible()
  await expect(page.locator('.read-state')).toHaveText('未读')
  await expect(page.getByRole('link', { name: '返回已发送通知' })).toHaveAttribute('href', '/notices/sent')
  expect(confirms).toHaveLength(0)
  await page.goto('http://demo.team.lostsky.work:5175/personal/notices')
  await expect(page.getByRole('link', { name: '发送通知', exact: true })).toHaveCount(0)
  await page.locator('.ls-resource-list').getByRole('link').click()
  await expect.poll(() => confirms.length).toBe(1)
  expect(confirms[0]).toContain('entity')
  await expect(page.getByRole('link', { name: '返回通知列表' })).toHaveAttribute('href', '/personal/notices')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})
