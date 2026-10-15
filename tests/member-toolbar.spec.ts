import { expect, test } from './fixtures'

test('member toolbar keeps search compact, filters spaced and results accurate', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([{
    name: 'lostsky_token',
    value: `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'team', id: 1 } })).toString('base64url')}.x`,
    domain: '.lostsky.work', path: '/', sameSite: 'Lax',
  }])
  const members = [
    { id: 1, user_id: 10, nickname: '青空成员', slug: 'alice', status_code: 'active', status_label: '正常' },
    { id: 2, user_id: 20, nickname: '已封禁成员', slug: 'bob', status_code: 'blocked', status_label: '已封禁' },
  ]
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/access')) data = { team: { id: 1, slug: 'demo', name: '青空团队' }, permissions: ['team.member.read', 'team.notice.read'], abilities: {} }
    else if (path.endsWith('/member/index')) data = members
    else if (path.endsWith('/notice/index')) data = { list: [], total: 0, page: 1, limit: 20 }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://demo.team.lostsky.work:5175/members')
  const toolbar = page.getByRole('search')
  const search = toolbar.getByRole('searchbox', { name: '搜索成员' })
  const count = toolbar.locator('[aria-live="polite"]')
  await expect(count).toHaveText('共 2 位成员')

  // Protect the relationships exposed by the screenshot, not just the wrapper width.
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const inputBox = (await toolbar.locator('.ls-search-input').boundingBox())!
    const filterBox = (await toolbar.locator('.n-select').boundingBox())!
    const countBox = (await count.boundingBox())!
    if (width >= 1024) {
      expect(inputBox.width).toBeLessThanOrEqual(448)
      expect(filterBox.x - inputBox.x - inputBox.width).toBeGreaterThanOrEqual(15)
      expect(countBox.x - filterBox.x - filterBox.width).toBeGreaterThanOrEqual(15)
      expect(filterBox.y).toBeCloseTo(inputBox.y, 0)
      expect(filterBox.height).toBeCloseTo(inputBox.height, 0)
    } else if (width < 640) {
      expect(inputBox.height).toBeGreaterThanOrEqual(44)
      expect(filterBox.height).toBeGreaterThanOrEqual(44)
      expect(filterBox.width).toBeCloseTo(inputBox.width, 0)
      expect(filterBox.y).toBeGreaterThanOrEqual(inputBox.y + inputBox.height + 11)
      expect(countBox.y).toBeGreaterThanOrEqual(filterBox.y + filterBox.height)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await search.focus()
  await expect(search).toBeFocused()
  const material = await toolbar.locator('.n-input').evaluate(element => {
    const style = getComputedStyle(element)
    return { color: style.getPropertyValue('--n-color').trim(), focus: style.getPropertyValue('--n-box-shadow-focus').trim() }
  })
  expect(material.color).toBe('rgba(18, 26, 30, .72)')
  expect(material.focus).toBe('none')
  await search.fill('alice')
  await expect(count).toHaveText('找到 1 位成员')
  await expect(page.locator('.ls-resource-row')).toHaveCount(1)
  await search.fill('不存在')
  await expect(count).toHaveText('找到 0 位成员')
  await expect(page.locator('.ls-empty-state')).toBeVisible()
  await search.fill('')
  await toolbar.locator('.n-select').click()
  await page.locator('.n-base-select-option').filter({ hasText: '已封禁' }).click()
  await expect(count).toHaveText('找到 1 位成员')
  await expect(page.locator('.ls-resource-row')).toContainText('@bob')

  // A real embedded caller also inherits the bounded search track.
  await page.goto('http://demo.team.lostsky.work:5175/notices/team')
  const embedded = page.locator('.ls-list-toolbar--embedded')
  await expect(embedded).toBeVisible()
  expect((await embedded.locator('.ls-search-input').boundingBox())!.width).toBeLessThanOrEqual(448)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  // Enlarge text and a long result label without changing the business fixture.
  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await embedded.locator('[aria-live="polite"]').evaluate(element => { element.textContent = '找到 123456 位符合当前筛选条件的成员' })
  expect(await embedded.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  expect(errors).toEqual([])
})
